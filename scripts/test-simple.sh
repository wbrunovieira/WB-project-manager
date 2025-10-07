#!/bin/bash
curl -X POST http://localhost:3000/api/issues \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 7ee69b9c6c4e74c7988b5ef7440dc3a78485b077c59eeb74f9e0485da6aa12f6" \
  -d '{"title":"Test Issue","workspaceId":"cmge96f200001wa7ouziczg0w","statusId":"cmge9i3pv0007walqv7is970v"}'
echo ""
