import { type User, type InsertUser, type Event, type InsertEvent } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Event methods
  getEvents(userId: string): Promise<Event[]>;
  getEvent(id: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent & { userId: string }): Promise<Event>;
  updateEvent(id: string, event: Partial<Event>): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<boolean>;

  // Dashboard methods
  getEventStats(userId: string): Promise<{
    totalEvents: number;
    acceptedEvents: number;
    totalRevenue: number;
    pendingEvents: number;
  }>;
  getMonthlyEventCounts(userId: string): Promise<Array<{ month: string; count: number }>>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private events: Map<string, Event>;

  constructor() {
    this.users = new Map();
    this.events = new Map();
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  // Event methods
  async getEvents(userId: string): Promise<Event[]> {
    return Array.from(this.events.values())
      .filter(event => event.userId === userId)
      .sort((a, b) => {
        const dateA = a.eventDate ? new Date(a.eventDate).getTime() : 0;
        const dateB = b.eventDate ? new Date(b.eventDate).getTime() : 0;
        return dateB - dateA;
      });
  }

  async getEvent(id: string): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async createEvent(eventData: InsertEvent & { userId: string }): Promise<Event> {
    const id = randomUUID();
    const now = new Date();
    const event: Event = {
      ...eventData,
      id,
      status: eventData.status || "pendente",
      guestCount: eventData.guestCount || null,
      serviceCharge: eventData.serviceCharge || "0",
      includeServiceCharge: eventData.includeServiceCharge || false,
      createdAt: now,
      updatedAt: now,
    };
    this.events.set(id, event);
    return event;
  }

  async updateEvent(id: string, eventData: Partial<Event>): Promise<Event | undefined> {
    const existingEvent = this.events.get(id);
    if (!existingEvent) {
      return undefined;
    }

    const updatedEvent: Event = {
      ...existingEvent,
      ...eventData,
      updatedAt: new Date(),
    };
    
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteEvent(id: string): Promise<boolean> {
    return this.events.delete(id);
  }

  // Dashboard methods
  async getEventStats(userId: string): Promise<{
    totalEvents: number;
    acceptedEvents: number;
    totalRevenue: number;
    pendingEvents: number;
  }> {
    const userEvents = await this.getEvents(userId);
    
    const totalEvents = userEvents.length;
    const acceptedEvents = userEvents.filter(e => e.status === 'aceito').length;
    const pendingEvents = userEvents.filter(e => e.status === 'pendente').length;
    const totalRevenue = userEvents
      .filter(e => e.status === 'aceito')
      .reduce((sum, e) => sum + parseFloat(e.totalValue), 0);

    return {
      totalEvents,
      acceptedEvents,
      totalRevenue,
      pendingEvents,
    };
  }

  async getMonthlyEventCounts(userId: string): Promise<Array<{ month: string; count: number }>> {
    const userEvents = await this.getEvents(userId);
    const monthCounts = new Map<string, number>();

    // Initialize last 6 months
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = months[date.getMonth()];
      monthCounts.set(monthKey, 0);
    }

    // Count events by month
    userEvents.forEach(event => {
      if (event.eventDate) {
        const eventDate = new Date(event.eventDate);
        const monthKey = months[eventDate.getMonth()];
        const currentCount = monthCounts.get(monthKey) || 0;
        monthCounts.set(monthKey, currentCount + 1);
      }
    });

    return Array.from(monthCounts.entries()).map(([month, count]) => ({
      month,
      count,
    }));
  }
}

export const storage = new MemStorage();
