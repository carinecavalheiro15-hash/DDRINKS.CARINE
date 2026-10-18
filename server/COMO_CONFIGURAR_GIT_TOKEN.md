# Publicação automática de fotos no GitHub (token do servidor)

O servidor roda como Serviço do Windows (conta "LocalSystem"), que não
enxerga o seu login do GitHub salvo na sua conta de usuário. Pra ele
conseguir publicar as fotos automaticamente (cardápio digital), crie um
arquivo de credenciais só pra esse processo usar — não precisa mexer na
sua conta do GitHub no dia a dia, e dá pra revogar isso a qualquer
momento sem afetar seu próprio login.

## Passo 1 — Gerar um token no GitHub

1. Acesse: https://github.com/settings/tokens
2. Clique em **"Generate new token"** → **"Generate new token (classic)"**
3. Em "Note", coloque algo como `ddrinks-servidor-local`
4. Em "Expiration", escolha o prazo que preferir (ex: "No expiration" ou 1 ano)
5. Marque só o escopo **`repo`** (acesso aos repositórios)
6. Clique em **"Generate token"**
7. **Copie o token** (começa com `ghp_...`) — ele só aparece uma vez

## Passo 2 — Criar o arquivo de credenciais

Abra o PowerShell (não precisa ser como administrador) e rode o comando
abaixo, **trocando `COLE_SEU_TOKEN_AQUI` pelo token que você copiou**:

```powershell
"https://carinecavalheiro15-hash:COLE_SEU_TOKEN_AQUI@github.com" | Out-File -FilePath "C:\Users\CarineCavalheiro\Downloads\Ddrinks\Ddrinks\DDRINKS.CARINE-main\DDRINKS.CARINE-main\server\.git-credentials" -Encoding ascii -NoNewline
```

Esse arquivo fica só no seu computador — ele já está na lista de arquivos
que nunca vão pro GitHub (`.gitignore`).

## Passo 3 — Reiniciar o serviço

Numa janela de PowerShell **como administrador**:

```powershell
Restart-Service -Name DDrinksServer -Force
```

Pronto. Da próxima vez que anexar uma foto (do casal ou de um drink), ela
deve publicar sozinha no GitHub.

## Se um dia quiser revogar

Vá em https://github.com/settings/tokens, encontre `ddrinks-servidor-local`
e clique em "Delete". A publicação automática para de funcionar (mas as
fotos continuam salvando normalmente neste computador) até você gerar um
token novo e repetir o Passo 2.
