#!/bin/bash
curl -X POST http://localhost:3000/api/issues \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"title":"Test Issue","workspaceId":"cmge96f200001wa7ouziczg0w","statusId":"cmge9i3pv0007walqv7is970v"}'
echo ""
