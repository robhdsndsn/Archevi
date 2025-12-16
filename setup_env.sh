#!/bin/bash
# Quick setup script to generate secure JWT_SECRET

echo "=========================================="
echo "Environment Setup for FamilySecondBrain"
echo "=========================================="
echo ""

# Generate JWT_SECRET
JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")

echo "Generated secure JWT_SECRET:"
echo "$JWT_SECRET"
echo ""

# Update .env file
if [ -f Infrastructure/.env ]; then
    sed -i "s/JWT_SECRET=PLEASE_GENERATE_A_SECURE_RANDOM_32_CHAR_STRING/JWT_SECRET=$JWT_SECRET/" Infrastructure/.env
    echo "✓ Updated Infrastructure/.env with new JWT_SECRET"
else
    echo "⚠ Infrastructure/.env not found. Please create it from .env.example first."
fi

echo ""
echo "=========================================="
echo "Next Steps:"
echo "=========================================="
echo "1. Go to Windmill UI: http://localhost"
echo "2. Navigate to Settings > Tokens"
echo "3. Create a new token for WINDMILL_TOKEN"
echo "4. Rotate WINDMILL_MCP_TOKEN (generate new MCP URL)"
echo "5. Update Infrastructure/.env with the new tokens"
echo ""
echo "IMPORTANT: The old MCP token is exposed and should be rotated!"
echo "=========================================="
