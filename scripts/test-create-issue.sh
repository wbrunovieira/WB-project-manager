#!/bin/bash
TOKEN="eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwia2lkIjoiWjY2YWY2TmltV1F4S1d5LVotSy1YZkVaaXRuY3ZuY1c3WU9pVXNxbXFZMGRXTGtoeVhIN1BRb0VQMWNjbWlkQ3ZrYV85bWhyRklvWkFyRHRnMjBNN0EifQ..A9FuJ0M_ujjBTM86a7-w1w.b9jNXm-UhcmYo9eBMwdoZh2iWEbTRRISgJfQeNgYEA_Sq5G9MGGdHm83C55ySPrW8pyYB1W_20M__CD2AirilLFFh5brdxIssbAVPN0dTy6TvARaRCzvQ7oM7KnUc_-CUZBtnHsCaoke_DfhdanDDiJgUbcQzeK8grOwrIysYfi5gf8N0dfA6HpuBznWMTXCPZ7CIhamkSMnpMOn9qgv6CpmvmzNqPr9ySvxGVgkqnk.C02pZ64hkspwP7pLF4XBpMYx_68TbJIYPL4MOwVBeKE"

curl -X POST 'http://localhost:3000/api/issues' \
  -H 'Content-Type: application/json' \
  -H "Cookie: next-auth.session-token=${TOKEN}" \
  -d '{
    "title": "Fase 1: Value Objects - Sistema de Tokens Únicos Zoom",
    "description": "## 🎯 Objetivo\n\nImplementar os Value Objects fundamentais para o sistema de tokens únicos de entrada em sessões Zoom.",
    "workspaceId": "cmge96f200001wa7ouziczg0w",
    "projectId": "cmgfjhyh50005waqglsynsz1d",
    "milestoneId": "cmggc1uqk0001wakb3no9xhb7",
    "statusId": "cmge9i3pv0007walqv7is970v",
    "assigneeId": "cmge96f1y0000wa7olxm69prv",
    "priority": "HIGH",
    "type": "FEATURE",
    "labelIds": ["cmgf23zl50009watfyq73olpr"]
  }'
