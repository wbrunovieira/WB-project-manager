#!/bin/bash

echo "🧪 Testando criação em lote de issues..."
echo ""

curl -s -X POST http://localhost:3000/api/issues/bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 7ee69b9c6c4e74c7988b5ef7440dc3a78485b077c59eeb74f9e0485da6aa12f6" \
  -d '{
    "workspaceId": "cmge96f200001wa7ouziczg0w",
    "issues": [
      {
        "title": "Implementar autenticação JWT",
        "description": "Adicionar suporte para tokens JWT na API",
        "statusId": "cmge9i3pv0007walqv7is970v",
        "projectId": "cmgfjhyh50005waqglsynsz1d",
        "milestoneId": "cmggc1uqk0001wakb3no9xhb7",
        "assigneeId": "cmge96f1y0000wa7olxm69prv",
        "priority": "HIGH",
        "type": "FEATURE",
        "labelIds": ["cmgf23zl50009watfyq73olpr"]
      },
      {
        "title": "Corrigir bug no login",
        "description": "Usuário não consegue fazer login com senha especial",
        "statusId": "cmge9i3pv0007walqv7is970v",
        "projectId": "cmgfjhyh50005waqglsynsz1d",
        "priority": "URGENT",
        "type": "BUG",
        "labelIds": ["cmgfcyxlz0003waknba486r40"]
      },
      {
        "title": "Melhorar performance do dashboard",
        "description": "Dashboard está lento com muitos projetos",
        "statusId": "cmge9i3pt0005walququqw1rx",
        "projectId": "cmgfjhyh50005waqglsynsz1d",
        "priority": "MEDIUM",
        "type": "IMPROVEMENT",
        "labelIds": ["cmgf21xvb0003watfaqi1ynw7"]
      }
    ]
  }'

echo ""
echo ""
