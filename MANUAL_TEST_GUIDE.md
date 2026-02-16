# Manual Testing Guide - DELETE & BDR Chat
**Production Environment:** https://valhros.com

---

## Test 1: DELETE Functionality (10 minutes)

### Setup
1. **Navigate to** https://valhros.com/investors
2. **Verify** you see the Investor Pipeline page

### Test 1.1: Create Test Investor
1. **Click** "New Investor" or "Create" button
2. **Fill in:**
   - Firm Name: `TEST DELETE - [Your Name] - [Timestamp]`
   - Stage: `Initial Contact`
3. **Click** "Create"
4. **Verify:** New investor appears in the list

### Test 1.2: Soft Delete
1. **Click** on the test investor you just created
2. **Scroll down** to find the "Delete" button
3. **Click** "Delete" button
4. **Verify:** Confirmation dialog appears
5. **Click** "Delete" in the dialog to confirm
6. **✅ PASS if:**
   - Toast notification appears: "Deleted" or similar
   - "Undo" button visible in toast (for ~10 seconds)
   - Investor disappears from the list
7. **Navigate back** to /investors
8. **✅ PASS if:** Deleted investor NOT in list

### Test 1.3: Undo Delete (Within 10 seconds)
1. **Create another test investor** (same steps as 1.1)
   - Firm Name: `TEST UNDO DELETE - [Your Name]`
2. **Delete it** (same steps as 1.2)
3. **Quickly click "Undo"** button in toast (within 10 seconds)
4. **✅ PASS if:**
   - Investor reappears in the list
   - Toast shows "Restored" or similar
5. **Refresh page**
6. **✅ PASS if:** Investor still visible (restoration was saved)

### Test 1.4: Permanent Delete (After undo window)
1. **Delete the "TEST UNDO DELETE" investor** again
2. **Wait 11+ seconds** (let undo window expire)
3. **Refresh page**
4. **✅ PASS if:**
   - Investor still gone
   - No way to restore it
   - This confirms permanent delete after undo window

### Test 1.5: Cleanup
Delete any remaining test investors you created.

---

## Test 2: BDR Chat Agent (5 minutes)

### Test 2.1: Open Chat Interface
1. **Look for** "AI BDR" or "BDR Agent" button in navigation
   - Usually in top-right or header area
2. **Click** the BDR button
3. **✅ PASS if:**
   - Chat panel/modal opens
   - See chat interface with input field
   - May see welcome message or suggested prompts

### Test 2.2: Basic Query
1. **Type in chat:** `How many investors do we have?`
2. **Press Enter** or click Send
3. **✅ PASS if:**
   - Message appears in chat
   - Loading indicator shows (briefly)
   - AI responds within 5-10 seconds
   - Response includes a number (count of investors)

### Test 2.3: Investor Data Query
1. **Type in chat:** `What stages are our investors in?`
2. **Send message**
3. **✅ PASS if:**
   - AI responds with stage information
   - Lists actual stages from your data
   - Response is relevant to your pipeline

### Test 2.4: Strategic Query
1. **Type in chat:** `Which investors are stalled?`
2. **Send message**
3. **✅ PASS if:**
   - AI responds with stalled investor information
   - Response is contextual (uses real data)
   - May list specific investor names or say "none"

### Test 2.5: Tool Execution (Advanced)
1. **Type in chat:** `Show me details about [specific investor firm name]`
2. **Send message**
3. **✅ PASS if:**
   - AI queries database for that investor
   - Returns specific details (stage, value, etc.)
   - Response is accurate to what you see in UI

### Test 2.6: Chat History
1. **Scroll up** in chat
2. **✅ PASS if:**
   - Previous messages still visible
   - Full conversation history maintained
3. **Close chat panel**
4. **Reopen chat panel**
5. **✅ PASS if:**
   - Messages still there (session persists)

---

## Test Results Summary

### DELETE Functionality
- [ ] Test 1.1: Create test investor - PASS/FAIL
- [ ] Test 1.2: Soft delete works - PASS/FAIL
- [ ] Test 1.3: Undo restore works - PASS/FAIL
- [ ] Test 1.4: Permanent delete after window - PASS/FAIL
- [ ] Test 1.5: Cleanup complete - PASS/FAIL

### BDR Chat Agent
- [ ] Test 2.1: Chat interface opens - PASS/FAIL
- [ ] Test 2.2: Basic query response - PASS/FAIL
- [ ] Test 2.3: Investor data query - PASS/FAIL
- [ ] Test 2.4: Strategic query - PASS/FAIL
- [ ] Test 2.5: Tool execution - PASS/FAIL
- [ ] Test 2.6: Chat history persists - PASS/FAIL

---

## Expected Issues (Known Limitations)

### DELETE
- ⚠️ If ANTHROPIC_API_KEY not set, BDR chat won't work (shows error)
- ⚠️ Undo window is exactly 10 seconds - be quick!

### BDR Chat
- ⚠️ Requires ANTHROPIC_API_KEY in environment variables
- ⚠️ If API key missing/invalid, will show error message
- ⚠️ First response may be slower (~10s) as AI initializes

---

## Reporting Issues

If any test fails, note:
1. Which test failed
2. What you expected to happen
3. What actually happened
4. Any error messages shown
5. Browser console errors (F12 → Console tab)

---

## ✅ Success Criteria

**DELETE Functionality:** All 5 tests pass
**BDR Chat Agent:** All 6 tests pass

If all tests pass → **Production is fully functional!** 🎉

---

*Manual testing guide created: 2026-02-15*
*For production environment: https://valhros.com*
