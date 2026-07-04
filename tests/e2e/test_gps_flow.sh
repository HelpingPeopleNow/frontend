#!/bin/bash
# GPS Geolocation E2E Test
set -euo pipefail

BASE="https://helpingpeople.cloud"
WORKER_COOKIE="lfk2QEfw9ITnCQ8ICRiTRSjLodCaXMpu"
CLIENT_COOKIE="WDF3nhfVpreDIl4NccShkxcSfPzNtnz0"

PASS=0
FAIL=0

check_json() {
  local desc="$1" python_check="$2" json="$3"
  if echo "$json" | python3 -c "import sys,json; d=json.load(sys.stdin); $python_check" 2>/dev/null; then
    echo "  ✅ $desc"
    PASS=$((PASS+1))
  else
    echo "  ❌ $desc"
    FAIL=$((FAIL+1))
  fi
}

echo "=== TEST 1: Worker intake with GPS coords ==="
RESP=$(curl -sS -X POST "$BASE/api/v1/chat" \
  -H "Content-Type: application/json" \
  -b "__Secure-better-auth.session_token=$WORKER_COOKIE" \
  -d '{
    "mode": "worker_intake",
    "message": "My business name is Cimbel Electric and I serve Valencia area",
    "latitude": 40.4168,
    "longitude": -3.7038
  }')

check_json "Worker intake returns answer with detected fields" \
  "assert 'answer' in d and len(d.get('answer','')) > 10" "$RESP"

# Verify coordinates saved in profile
PROFILE=$(curl -sS "$BASE/api/v1/worker/profile" \
  -b "__Secure-better-auth.session_token=$WORKER_COOKIE")

check_json "Worker latitude saved (40.4168)" \
  "assert d.get('latitude') is not None and abs(d['latitude'] - 40.4168) < 0.01" "$PROFILE"
check_json "Worker longitude saved (-3.7038)" \
  "assert d.get('longitude') is not None and abs(d['longitude'] - (-3.7038)) < 0.01" "$PROFILE"

echo ""
echo "=== TEST 2: Client search with Barcelona coords (distance = 505 km) ==="
SEARCH=$(curl -sS -X POST "$BASE/api/v1/chat" \
  -H "Content-Type: application/json" \
  -b "__Secure-better-auth.session_token=$CLIENT_COOKIE" \
  -d '{
    "mode": "search",
    "message": "electrician in Valencia",
    "latitude": 41.3874,
    "longitude": 2.1686
  }')

check_json "Search returns workers array" \
  "assert 'workers' in d and len(d.get('workers',[])) > 0" "$SEARCH"
check_json "Cimbel Electric found in results" \
  "assert any('Cimbel' in (w.get('business_name','') or '') for w in d.get('workers',[]))" "$SEARCH"
check_json "Distance ~505 km for Cimbel" \
  "cimbel = next((w for w in d.get('workers',[]) if 'Cimbel' in (w.get('business_name','') or '')), None); assert cimbel and cimbel.get('distance_km') and abs(cimbel['distance_km'] - 505.1) < 1" "$SEARCH"

echo ""
echo "=== TEST 3: Search without fresh GPS (stored profile coords used) ==="
NOGPS=$(curl -sS -X POST "$BASE/api/v1/chat" \
  -H "Content-Type: application/json" \
  -b "__Secure-better-auth.session_token=$CLIENT_COOKIE" \
  -d '{
    "mode": "search",
    "message": "electrician in Valencia"
  }')

check_json "Search still returns results with stored coords" \
  "assert 'workers' in d and len(d.get('workers',[])) > 0" "$NOGPS"
check_json "Distance still shown (stored coords)" \
  "assert any(w.get('distance_km') is not None for w in d.get('workers',[]))" "$NOGPS"

echo ""
echo "=== TEST 4: Client intake with GPS coords ==="
CINTAKE=$(curl -sS -X POST "$BASE/api/v1/chat" \
  -H "Content-Type: application/json" \
  -b "__Secure-better-auth.session_token=$CLIENT_COOKIE" \
  -d '{
    "mode": "client_intake",
    "message": "I need an electrician for my apartment in Barcelona",
    "latitude": 41.3874,
    "longitude": 2.1686
  }')

check_json "Client intake returns answer" \
  "assert 'answer' in d and len(d.get('answer','')) > 10" "$CINTAKE"

CPROFILE=$(curl -sS "$BASE/api/v1/client/profile" \
  -b "__Secure-better-auth.session_token=$CLIENT_COOKIE")

check_json "Client latitude saved (41.3874)" \
  "assert d.get('latitude') is not None and abs(d['latitude'] - 41.3874) < 0.01" "$CPROFILE"
check_json "Client longitude saved (2.1686)" \
  "assert d.get('longitude') is not None and abs(d['longitude'] - 2.1686) < 0.01" "$CPROFILE"

echo ""
echo "=========================================="
echo "  GPS E2E Results: $PASS passed, $FAIL failed"
echo "=========================================="

[ "$FAIL" -eq 0 ] && echo "  🎉 ALL TESTS PASSED!" || echo "  ⚠️ Some tests failed"
exit "$FAIL"
