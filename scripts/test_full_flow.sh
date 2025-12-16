#!/bin/bash
#
# Archevi Full Flow Automated Test Suite
# Tests the complete application flow using curl
#
# Usage: bash scripts/test_full_flow.sh
#

set -e

# Configuration - uses environment variables with sensible defaults
WINDMILL_URL="${WINDMILL_URL:-http://localhost}"
WORKSPACE="${WINDMILL_WORKSPACE:-family-brain}"
TOKEN="${WINDMILL_TOKEN:?Error: WINDMILL_TOKEN environment variable must be set}"
BASE_URL="$WINDMILL_URL/api/w/$WORKSPACE/jobs/run_wait_result/p"
SUPABASE_URL="${SUPABASE_URL:-https://imgwjychhygtfyczsijd.supabase.co}"

# Test tracking
TESTS_PASSED=0
TESTS_FAILED=0
TEST_TENANT_ID=""
TEST_USER_ID=""
TEST_DOC_ID=""
TEST_FAMILY_MEMBER_ID=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Generate unique test identifiers
TEST_RUN_ID=$(date +%s)
TEST_FAMILY_NAME="Test Family $TEST_RUN_ID"
TEST_EMAIL="test-$TEST_RUN_ID@archevi.test"
TEST_SLUG="test-$TEST_RUN_ID"

#######################################
# Utility Functions
#######################################

log_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
}

log_test() {
    echo -e "${YELLOW}  ▶ $1${NC}"
}

log_pass() {
    echo -e "${GREEN}    ✓ PASS: $1${NC}"
    ((TESTS_PASSED++))
}

log_fail() {
    echo -e "${RED}    ✗ FAIL: $1${NC}"
    ((TESTS_FAILED++))
}

log_info() {
    echo -e "    ℹ $1"
}

# Make API call to Windmill
api_call() {
    local script_path=$1
    local payload=$2
    local timeout=${3:-30}

    curl -s "$BASE_URL/$script_path" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "$payload" \
        --max-time $timeout 2>/dev/null
}

# Check if response contains error
has_error() {
    echo "$1" | grep -q '"error"' && return 0 || return 1
}

# Extract value from JSON
json_value() {
    echo "$1" | grep -o "\"$2\":[^,}]*" | head -1 | sed 's/.*://; s/"//g; s/^ *//'
}

#######################################
# Test Suite
#######################################

test_windmill_health() {
    log_header "1. WINDMILL HEALTH CHECK"

    log_test "Checking Windmill version..."
    local version=$(curl -s "$WINDMILL_URL/api/version" --max-time 5 2>/dev/null)
    if [[ -n "$version" ]]; then
        log_pass "Windmill running: $version"
    else
        log_fail "Windmill not responding"
        return 1
    fi

    log_test "Checking workers..."
    local workers=$(curl -s "$WINDMILL_URL/api/workers/list" -H "Authorization: Bearer $TOKEN" --max-time 5 2>/dev/null)
    if [[ "$workers" == *"worker"* ]]; then
        local count=$(echo "$workers" | grep -o '"worker"' | wc -l)
        log_pass "Workers active: $count workers"
    else
        log_fail "No workers found"
    fi

    log_test "Running backend health check..."
    local health=$(api_call "f/chatbot/health_check" "{}")
    if [[ "$health" == *'"status": "healthy"'* ]]; then
        log_pass "Backend services healthy"
        log_info "PostgreSQL: $(echo "$health" | grep -o '"postgres":{[^}]*}' | grep -o '"status":"[^"]*"')"
        log_info "Cohere: $(echo "$health" | grep -o '"cohere_chat":{[^}]*}' | grep -o '"status":"[^"]*"')"
    else
        log_fail "Backend health check failed"
        echo "$health"
    fi
}

test_tenant_creation() {
    log_header "2. TENANT/FAMILY CREATION"

    log_test "Creating new tenant: $TEST_FAMILY_NAME..."
    local result=$(api_call "f/chatbot/create_tenant" "{
        \"name\": \"$TEST_FAMILY_NAME\",
        \"owner_email\": \"$TEST_EMAIL\",
        \"plan\": \"starter\"
    }" 30)

    if [[ "$result" == *"tenant_id"* ]]; then
        TEST_TENANT_ID=$(echo "$result" | grep -o '"tenant_id":"[^"]*"' | sed 's/.*://; s/"//g')
        log_pass "Tenant created: $TEST_TENANT_ID"
        log_info "Slug: $(echo "$result" | grep -o '"slug":"[^"]*"' | sed 's/.*://; s/"//g')"
    else
        log_fail "Tenant creation failed"
        echo "$result"
        return 1
    fi

    log_test "Verifying tenant in list..."
    local tenants=$(api_call "f/chatbot/list_tenants" "{}")
    if [[ "$tenants" == *"$TEST_TENANT_ID"* ]]; then
        log_pass "Tenant appears in list"
    else
        log_fail "Tenant not found in list"
    fi

    log_test "Getting tenant details..."
    local details=$(api_call "f/admin/get_tenant_details" "{\"tenant_id\": \"$TEST_TENANT_ID\"}")
    if [[ "$details" == *"$TEST_FAMILY_NAME"* ]]; then
        log_pass "Tenant details retrieved"
        log_info "Plan: $(echo "$details" | grep -o '"plan":"[^"]*"' | head -1 | sed 's/.*://; s/"//g')"
        log_info "Status: $(echo "$details" | grep -o '"status":"[^"]*"' | head -1 | sed 's/.*://; s/"//g')"
    else
        log_fail "Failed to get tenant details"
    fi
}

test_family_members() {
    log_header "3. FAMILY MEMBER MANAGEMENT"

    log_test "Listing family members..."
    local members=$(api_call "f/chatbot/manage_family_members" "{
        \"action\": \"list\",
        \"tenant_id\": \"$TEST_TENANT_ID\"
    }")
    if [[ "$members" == *'"success": true'* ]]; then
        local count=$(echo "$members" | grep -o '"count":' | head -1)
        log_pass "Members listed successfully"
    else
        log_fail "Failed to list members"
    fi

    log_test "Adding family member..."
    local add_result=$(api_call "f/chatbot/manage_family_members" "{
        \"action\": \"add\",
        \"tenant_id\": \"$TEST_TENANT_ID\",
        \"name\": \"Test Child $TEST_RUN_ID\",
        \"email\": \"child-$TEST_RUN_ID@archevi.test\",
        \"role\": \"member\",
        \"member_type\": \"child\"
    }")
    if [[ "$add_result" == *'"success": true'* ]] || [[ "$add_result" == *'"id":'* ]]; then
        TEST_FAMILY_MEMBER_ID=$(echo "$add_result" | grep -o '"id":[0-9]*' | head -1 | sed 's/.*://')
        log_pass "Family member added: ID $TEST_FAMILY_MEMBER_ID"
    else
        log_fail "Failed to add family member"
        echo "$add_result"
    fi

    log_test "Updating family member..."
    if [[ -n "$TEST_FAMILY_MEMBER_ID" ]]; then
        local update_result=$(api_call "f/chatbot/manage_family_members" "{
            \"action\": \"update\",
            \"tenant_id\": \"$TEST_TENANT_ID\",
            \"member_id\": $TEST_FAMILY_MEMBER_ID,
            \"name\": \"Updated Child $TEST_RUN_ID\",
            \"member_type\": \"teen\"
        }")
        if [[ "$update_result" == *'"success": true'* ]]; then
            log_pass "Family member updated"
        else
            log_fail "Failed to update family member"
        fi
    else
        log_info "Skipping update - no member ID"
    fi
}

test_document_operations() {
    log_header "4. DOCUMENT OPERATIONS"

    log_test "Creating test document..."
    local doc_content="Test document created at $(date). This is automated test content for the Archevi system. It contains information about family history and important dates."

    # Use update_document to create (upsert behavior)
    local create_result=$(api_call "f/chatbot/update_document" "{
        \"tenant_id\": \"$TEST_TENANT_ID\",
        \"title\": \"Automated Test Document $TEST_RUN_ID\",
        \"content\": \"$doc_content\",
        \"category\": \"general\",
        \"user_id\": \"test-user\"
    }" 30)

    if [[ "$create_result" == *'"id"'* ]] || [[ "$create_result" == *'"document_id"'* ]]; then
        TEST_DOC_ID=$(echo "$create_result" | grep -oE '"(id|document_id)":[0-9]+' | head -1 | grep -oE '[0-9]+')
        log_pass "Document created: ID $TEST_DOC_ID"
    else
        log_fail "Document creation failed"
        echo "$create_result"
    fi

    log_test "Searching documents..."
    local search_result=$(api_call "f/chatbot/search_documents" "{
        \"tenant_id\": \"$TEST_TENANT_ID\",
        \"query\": \"automated test\"
    }")
    if [[ "$search_result" == *'"success": true'* ]]; then
        local doc_count=$(echo "$search_result" | grep -o '"count":' | head -1)
        log_pass "Document search works"
    else
        log_fail "Document search failed"
    fi

    log_test "Getting document details..."
    if [[ -n "$TEST_DOC_ID" ]]; then
        local doc_details=$(api_call "f/chatbot/get_document" "{
            \"tenant_id\": \"$TEST_TENANT_ID\",
            \"document_id\": $TEST_DOC_ID
        }")
        if [[ "$doc_details" == *"$TEST_RUN_ID"* ]]; then
            log_pass "Document details retrieved"
        else
            log_fail "Failed to get document details"
        fi
    fi

    log_test "Testing advanced search..."
    local adv_search=$(api_call "f/chatbot/search_documents_advanced" "{
        \"tenant_id\": \"$TEST_TENANT_ID\",
        \"query\": \"test\",
        \"category\": \"general\",
        \"limit\": 5
    }")
    if [[ "$adv_search" == *'"results"'* ]] || [[ "$adv_search" == *'"documents"'* ]]; then
        log_pass "Advanced search works"
    else
        log_fail "Advanced search failed"
    fi
}

test_rag_queries() {
    log_header "5. RAG/AI QUERIES"

    log_test "Testing RAG query..."
    local rag_result=$(api_call "f/chatbot/rag_query" "{
        \"tenant_id\": \"$TEST_TENANT_ID\",
        \"query\": \"What documents are in this archive?\",
        \"user_id\": \"test-user\"
    }" 60)

    if [[ "$rag_result" == *'"answer"'* ]]; then
        log_pass "RAG query successful"
        log_info "Model: $(echo "$rag_result" | grep -o '"model_used":"[^"]*"' | sed 's/.*://; s/"//g')"
        log_info "Latency: $(echo "$rag_result" | grep -o '"latency_ms":[0-9]*' | sed 's/.*://')ms"
        log_info "Confidence: $(echo "$rag_result" | grep -o '"confidence":[0-9.]*' | sed 's/.*://')"
    else
        log_fail "RAG query failed"
        echo "$rag_result"
    fi

    log_test "Testing conversation history..."
    local history=$(api_call "f/chatbot/get_conversation_history" "{
        \"tenant_id\": \"$TEST_TENANT_ID\",
        \"user_id\": \"test-user\",
        \"limit\": 10
    }")
    if [[ "$history" == *'"conversations"'* ]] || [[ "$history" == *'"messages"'* ]] || [[ "$history" == "[]" ]]; then
        log_pass "Conversation history works"
    else
        log_fail "Conversation history failed"
    fi

    log_test "Testing search suggestions..."
    local suggestions=$(api_call "f/chatbot/get_search_suggestions" "{
        \"tenant_id\": \"$TEST_TENANT_ID\",
        \"query\": \"fam\"
    }")
    if [[ -n "$suggestions" ]]; then
        log_pass "Search suggestions work"
    else
        log_fail "Search suggestions failed"
    fi
}

test_timeline() {
    log_header "6. TIMELINE"

    log_test "Getting timeline events..."
    local timeline=$(api_call "f/chatbot/get_timeline_events" "{
        \"tenant_id\": \"$TEST_TENANT_ID\"
    }")
    if [[ "$timeline" == *'"events"'* ]]; then
        log_pass "Timeline retrieved"
        log_info "Events: $(echo "$timeline" | grep -o '"total_count":[0-9]*' | sed 's/.*://')"
    else
        log_fail "Timeline failed"
    fi

    log_test "Creating timeline event..."
    local event_result=$(api_call "f/chatbot/manage_timeline_event" "{
        \"action\": \"create\",
        \"tenant_id\": \"$TEST_TENANT_ID\",
        \"title\": \"Test Event $TEST_RUN_ID\",
        \"event_date\": \"2024-01-15\",
        \"event_type\": \"milestone\",
        \"description\": \"Automated test event\",
        \"source\": \"manual\"
    }")
    if [[ "$event_result" == *'"success": true'* ]] || [[ "$event_result" == *'"id"'* ]]; then
        log_pass "Timeline event created"
    else
        log_fail "Timeline event creation failed"
        echo "$event_result"
    fi
}

test_analytics() {
    log_header "7. ANALYTICS & STATS"

    log_test "Getting analytics..."
    local analytics=$(api_call "f/chatbot/get_analytics" "{
        \"tenant_id\": \"$TEST_TENANT_ID\"
    }")
    if [[ -n "$analytics" ]]; then
        log_pass "Analytics retrieved"
    else
        log_fail "Analytics failed"
    fi

    log_test "Getting embedding stats..."
    local embed_stats=$(api_call "f/chatbot/get_embedding_stats" "{
        \"tenant_id\": \"$TEST_TENANT_ID\"
    }")
    if [[ "$embed_stats" == *'"pgvector"'* ]]; then
        log_pass "Embedding stats retrieved"
    else
        log_fail "Embedding stats failed"
    fi

    log_test "Getting query stats..."
    local query_stats=$(api_call "f/chatbot/get_query_stats" "{
        \"tenant_id\": \"$TEST_TENANT_ID\",
        \"period\": \"month\"
    }")
    if [[ "$query_stats" == *'"summary"'* ]]; then
        log_pass "Query stats retrieved"
    else
        log_fail "Query stats failed"
    fi

    log_test "Getting usage stats..."
    local usage=$(api_call "f/chatbot/get_usage_stats" "{
        \"tenant_id\": \"$TEST_TENANT_ID\"
    }")
    if [[ "$usage" == *'"summary"'* ]]; then
        log_pass "Usage stats retrieved"
    else
        log_fail "Usage stats failed"
    fi
}

test_branding() {
    log_header "8. BRANDING & THEMING"

    log_test "Getting tenant branding..."
    local branding=$(api_call "f/chatbot/get_tenant_branding" "{
        \"tenant_id\": \"$TEST_TENANT_ID\"
    }")
    if [[ "$branding" == *'"brand_name"'* ]] || [[ "$branding" == *'"primary_color"'* ]]; then
        log_pass "Branding retrieved"
    else
        log_fail "Branding failed"
    fi

    log_test "Listing theme presets..."
    local presets=$(api_call "f/chatbot/list_theme_presets" "{}")
    if [[ "$presets" == *'"presets"'* ]]; then
        local preset_count=$(echo "$presets" | grep -o '"count":[0-9]*' | sed 's/.*://')
        log_pass "Theme presets listed: $preset_count presets"
    else
        log_fail "Theme presets failed"
    fi

    log_test "Updating branding..."
    local update_brand=$(api_call "f/chatbot/update_tenant_branding" "{
        \"tenant_id\": \"$TEST_TENANT_ID\",
        \"brand_name\": \"$TEST_FAMILY_NAME Archive\",
        \"primary_color\": \"#3b82f6\"
    }")
    if [[ "$update_brand" == *'"success": true'* ]]; then
        log_pass "Branding updated"
    else
        log_fail "Branding update failed"
    fi
}

test_secure_links() {
    log_header "9. SECURE DOCUMENT SHARING"

    if [[ -z "$TEST_DOC_ID" ]]; then
        log_info "Skipping - no test document created"
        return
    fi

    log_test "Creating secure link..."
    local link_result=$(api_call "f/chatbot/create_secure_link" "{
        \"tenant_id\": \"$TEST_TENANT_ID\",
        \"document_id\": $TEST_DOC_ID,
        \"created_by\": \"test-user\",
        \"expires_in_days\": 7,
        \"max_views\": 10
    }")
    if [[ "$link_result" == *'"token"'* ]] || [[ "$link_result" == *'"link"'* ]]; then
        log_pass "Secure link created"
    else
        log_fail "Secure link creation failed"
        echo "$link_result"
    fi

    log_test "Listing secure links..."
    local links=$(api_call "f/chatbot/list_secure_links" "{
        \"tenant_id\": \"$TEST_TENANT_ID\"
    }")
    if [[ "$links" == *'"links"'* ]] || [[ "$links" == "[]" ]]; then
        log_pass "Secure links listed"
    else
        log_fail "Secure links listing failed"
    fi
}

test_admin_features() {
    log_header "10. ADMIN FEATURES"

    log_test "Listing all tenants (admin)..."
    local tenants=$(api_call "f/admin/list_tenants" "{}")
    if [[ "$tenants" == *'"id"'* ]]; then
        local count=$(echo "$tenants" | grep -o '"id":' | wc -l)
        log_pass "Admin tenant list: $count tenants"
    else
        log_fail "Admin tenant list failed"
    fi

    log_test "Getting admin audit logs..."
    local logs=$(api_call "f/admin/get_admin_audit_logs" "{\"limit\": 10}")
    if [[ "$logs" == *'"logs"'* ]]; then
        log_pass "Audit logs retrieved"
    else
        log_fail "Audit logs failed"
    fi

    log_test "Updating tenant (admin)..."
    local update=$(api_call "f/admin/update_tenant" "{
        \"tenant_id\": \"$TEST_TENANT_ID\",
        \"actor_email\": \"admin@test.local\",
        \"ai_allowance_usd\": 5.0
    }")
    if [[ "$update" == *'"id"'* ]] || [[ "$update" == *'"tenant_id"'* ]]; then
        log_pass "Tenant updated via admin"
    else
        log_fail "Admin tenant update failed"
    fi

    log_test "Getting database stats..."
    local db_stats=$(api_call "f/chatbot/get_database_stats" "{}")
    if [[ "$db_stats" == *'"postgres"'* ]]; then
        log_pass "Database stats retrieved"
    else
        log_fail "Database stats failed"
    fi
}

test_expiring_documents() {
    log_header "11. DOCUMENT EXPIRY & NOTIFICATIONS"

    log_test "Getting expiring documents..."
    local expiring=$(api_call "f/chatbot/get_expiring_documents" "{
        \"tenant_id\": \"$TEST_TENANT_ID\",
        \"days_ahead\": 30
    }")
    if [[ "$expiring" == *'"documents"'* ]] || [[ "$expiring" == *'"success"'* ]]; then
        log_pass "Expiring documents check works"
    else
        log_fail "Expiring documents failed"
    fi

    log_test "Getting tags..."
    local tags=$(api_call "f/chatbot/get_tags" "{
        \"tenant_id\": \"$TEST_TENANT_ID\"
    }")
    if [[ -n "$tags" ]]; then
        log_pass "Tags retrieved"
    else
        log_fail "Tags failed"
    fi
}

test_biography() {
    log_header "12. BIOGRAPHY GENERATOR"

    if [[ -z "$TEST_FAMILY_MEMBER_ID" ]]; then
        log_info "Skipping - no family member created"
        return
    fi

    log_test "Generating biography..."
    local bio=$(api_call "f/chatbot/generate_biography" "{
        \"tenant_id\": \"$TEST_TENANT_ID\",
        \"family_member_id\": $TEST_FAMILY_MEMBER_ID,
        \"style\": \"narrative\",
        \"length\": \"short\"
    }" 60)
    if [[ "$bio" == *'"biography"'* ]] || [[ "$bio" == *'"content"'* ]]; then
        log_pass "Biography generated"
    else
        log_fail "Biography generation failed"
        echo "$bio"
    fi
}

cleanup_test_data() {
    log_header "13. CLEANUP"

    log_test "Cleaning up test tenant..."
    # Note: We don't actually delete - just log for manual cleanup if needed
    log_info "Test tenant ID: $TEST_TENANT_ID"
    log_info "Test run ID: $TEST_RUN_ID"
    log_info "Manual cleanup: DELETE FROM tenants WHERE id = '$TEST_TENANT_ID'"
    log_pass "Cleanup info logged"
}

print_summary() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}                        TEST SUMMARY${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "  ${GREEN}Passed: $TESTS_PASSED${NC}"
    echo -e "  ${RED}Failed: $TESTS_FAILED${NC}"
    echo ""
    local total=$((TESTS_PASSED + TESTS_FAILED))
    local pct=0
    if [[ $total -gt 0 ]]; then
        pct=$((TESTS_PASSED * 100 / total))
    fi
    echo -e "  Success Rate: ${pct}%"
    echo ""
    echo -e "  Test Run ID: $TEST_RUN_ID"
    echo -e "  Test Tenant: $TEST_TENANT_ID"
    echo ""

    if [[ $TESTS_FAILED -eq 0 ]]; then
        echo -e "${GREEN}  ALL TESTS PASSED!${NC}"
    else
        echo -e "${RED}  SOME TESTS FAILED - Review output above${NC}"
    fi
    echo ""
}

#######################################
# Main Execution
#######################################

main() {
    echo ""
    echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║       ARCHEVI FULL FLOW AUTOMATED TEST SUITE                  ║${NC}"
    echo -e "${BLUE}║       $(date)                        ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Test Run ID: $TEST_RUN_ID"
    echo "Target: $WINDMILL_URL ($WORKSPACE)"
    echo ""

    # Run all tests
    test_windmill_health
    test_tenant_creation
    test_family_members
    test_document_operations
    test_rag_queries
    test_timeline
    test_analytics
    test_branding
    test_secure_links
    test_admin_features
    test_expiring_documents
    test_biography
    cleanup_test_data

    print_summary

    # Exit with failure if any tests failed
    if [[ $TESTS_FAILED -gt 0 ]]; then
        exit 1
    fi
}

# Run main
main "$@"
