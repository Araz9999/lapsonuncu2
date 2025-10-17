# 🔍 ZƏNG VƏ VİDEOZƏNG - BUG ANALİZİ

## 📊 YOXLANILAN FAYLLAR

1. ✅ `app/call/[id].tsx` (447 sətir) - Active call screen
2. ✅ `app/call-history.tsx` (510 sətir) - Call history
3. ✅ `store/callStore.ts` (489 sətir) - Call state management

**Ümumi**: 1,446 sətir kod yoxlanıldı

---

## 🐛 TAPILAN BUGLAR

### 1️⃣ CALL SCREEN (app/call/[id].tsx)

#### Bug #1: Hardcoded Current User ID 🔴 Critical
**Lines**: 73, 100  
**Severity**: 🔴 Critical

```typescript
// ❌ PROBLEM:
const otherUserId = activeCall.callerId === 'user1' ? activeCall.receiverId : activeCall.callerId;
// Line 73: Hardcoded 'user1'
// Line 100: Comment says "Current user" but hardcoded
```

**Nəticə**:
- Multi-user support broken
- Wrong user identified in call
- Production failure with real users

**Həll**:
```typescript
// ✅ FIX:
const { currentUser } = useUserStore();
const otherUserId = activeCall.callerId === currentUser?.id 
  ? activeCall.receiverId 
  : activeCall.callerId;
```

---

#### Bug #2: Camera Resource Leak 🟡 Medium
**Lines**: 145-152  
**Severity**: 🟡 Medium

```typescript
// ⚠️ PROBLEM:
{activeCall.isVideoEnabled && permission.granted && (
  <View style={styles.localVideo}>
    <CameraView 
      style={styles.localCamera}
      facing={cameraFacing}
    />
  </View>
)}
// ❌ No cleanup when component unmounts or video disabled
// ❌ Camera may stay active in background
```

**Nəticə**:
- Camera stays active after call ends
- Battery drain
- Privacy issue
- Resource leak

**Həll**:
```typescript
// ✅ Add useEffect for camera cleanup:
useEffect(() => {
  return () => {
    // Cleanup camera when component unmounts
    if (activeCall?.isVideoEnabled) {
      // Stop camera
    }
  };
}, [activeCall?.isVideoEnabled]);
```

---

#### Bug #3: Timer Not Cleaned Up on Early Exit 🟡 Medium
**Lines**: 59-67  
**Severity**: 🟡 Medium

```typescript
// ⚠️ POTENTIAL ISSUE:
useEffect(() => {
  if (!isConnected) return;

  const interval = setInterval(() => {
    setCallDuration(prev => prev + 1);
  }, 1000);

  return () => clearInterval(interval);
}, [isConnected]);

// ❌ If component unmounts while !isConnected, no cleanup needed
// ✅ But if isConnected changes rapidly, could have multiple intervals
```

**Status**: Low risk but worth noting

---

### 2️⃣ CALL HISTORY (app/call-history.tsx)

#### Bug #4: Date Calculation Logic Error 🟡 Medium
**Lines**: 49-64  
**Severity**: 🟡 Medium

```typescript
// ❌ PROBLEM:
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {  // ❌ WRONG! diffDays=1 means YESTERDAY, not today!
    return language === 'az' ? 'Bu gün' : 'Сегодня';
  } else if (diffDays === 2) {  // ❌ Should be 1 for yesterday
    return language === 'az' ? 'Dünən' : 'Вчера';
  }
  // ...
};
```

**Nəticə**:
- "Bu gün" shows for yesterday's calls
- "Dünən" shows for 2 days ago
- Confusing user experience

**Həll**:
```typescript
// ✅ FIX:
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  
  // ✅ Validate date
  if (isNaN(date.getTime())) {
    return language === 'az' ? 'Tarix məlum deyil' : 'Дата неизвестна';
  }
  
  const now = new Date();
  
  // ✅ Check if same day
  const isSameDay = 
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  
  if (isSameDay) {
    return language === 'az' ? 'Bu gün' : 'Сегодня';
  }
  
  // ✅ Check if yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = 
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();
  
  if (isYesterday) {
    return language === 'az' ? 'Dünən' : 'Вчера';
  }
  
  // ✅ For other days, calculate difference
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays > 0 && diffDays <= 7) {
    return `${diffDays} ${language === 'az' ? 'gün əvvəl' : 'дней назад'}`;
  }
  
  return date.toLocaleDateString(language === 'az' ? 'az-AZ' : 'ru-RU');
};
```

---

#### Bug #5: No Date Validation 🟡 Medium
**Lines**: 50  
**Severity**: 🟡 Medium

```typescript
// ❌ PROBLEM:
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  // ❌ No check if date is valid!
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  // If dateString is invalid, getTime() returns NaN
  // Math.abs(NaN) = NaN, Math.ceil(NaN) = NaN
};
```

**Həll**: Add validation (included in Bug #4 fix above)

---

#### Bug #6: Hardcoded Current User 🟡 Medium
**Lines**: Multiple (67, 94, 119, 135, 181, 184, 255)  
**Severity**: 🟡 Medium

```typescript
// ❌ Lines where currentUser is used correctly BUT...
const { currentUser } = useUserStore();
// ✅ Already using currentUser, so this is OK!

// Actually NOT a bug - currentUser is properly imported and used
```

**Status**: ✅ False alarm - properly implemented!

---

### 3️⃣ CALL STORE (store/callStore.ts)

#### Bug #7: Hardcoded User ID in Store 🔴 Critical
**Lines**: 100, 117, 271  
**Severity**: 🔴 Critical

```typescript
// ❌ PROBLEM (3 places):

// Line 100:
callerId: 'user1', // ❌ Hardcoded current user

// Line 117:
callerId: 'user1', // ❌ Hardcoded current user

// Line 271:
getMissedCallsCount: () => {
  return get().calls.filter(call => 
    call.receiverId === 'user1' &&  // ❌ Hardcoded
    call.status === 'missed' && 
    !call.isRead
  ).length;
},
```

**Nəticə**:
- Multi-user broken
- All calls show as from/to 'user1'
- Production failure
- Critical for real deployment

**Həll**:
```typescript
// ✅ Store needs to accept currentUserId parameter
initiateCall: async (currentUserId: string, receiverId: string, listingId: string, type: CallType) => {
  const callId = Date.now().toString();
  const newCall: Call = {
    id: callId,
    callerId: currentUserId, // ✅ Dynamic
    receiverId,
    // ...
  };
  // ...
},

getMissedCallsCount: (currentUserId: string) => {
  return get().calls.filter(call => 
    call.receiverId === currentUserId &&  // ✅ Dynamic
    call.status === 'missed' && 
    !call.isRead
  ).length;
},
```

---

#### Bug #8: console.log Instead of Logger 🟢 Low
**Lines**: 325, 360  
**Severity**: 🟢 Low

```typescript
// ❌ PROBLEM (2 places):

// Line 325:
console.log('Haptic feedback interval error:', error);

// Line 360:
console.log('Haptic feedback interval error:', error);
```

**Həll**:
```typescript
// ✅ FIX:
logger.warn('Haptic feedback interval error:', error);
```

---

#### Bug #9: Potential ID Collision 🟢 Low
**Lines**: 97, 426  
**Severity**: 🟢 Low

```typescript
// ⚠️ PROBLEM:
const callId = Date.now().toString();
// ❌ If two calls initiated at exact same millisecond, same ID!
// Unlikely but possible in automated tests or rapid clicking
```

**Həll**:
```typescript
// ✅ FIX:
const callId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
```

---

#### Bug #10: Interval Cleanup in simulateIncomingCall 🟡 Medium
**Lines**: 473-487  
**Severity**: 🟡 Medium

```typescript
// ⚠️ PROBLEM:
// Auto-decline after 30 seconds if not answered
setTimeout(() => {
  const currentState = get();
  if (currentState.incomingCall?.id === callId) {
    get().declineCall(callId);
    // ...
  }
}, 30000);

// ❌ No way to cancel this timeout if call is answered
// ❌ Timeout will fire even if call already answered
// ❌ Could cause double-decline or state inconsistency
```

**Nəticə**:
- Timeout fires even after answer
- Potential state corruption
- Memory leak (timeout not stored/cleared)

**Həll**:
```typescript
// ✅ FIX: Store timeout ID and clear on answer/decline
interface CallStore {
  // ...
  incomingCallTimeouts: Map<string, NodeJS.Timeout>;
  // ...
}

// In simulateIncomingCall:
const timeout = setTimeout(() => {
  const currentState = get();
  if (currentState.incomingCall?.id === callId) {
    get().declineCall(callId);
    set((state) => ({
      calls: state.calls.map(call => 
        call.id === callId 
          ? { ...call, status: 'missed' as CallStatus }
          : call
      ),
    }));
  }
  // Remove from map
  get().incomingCallTimeouts.delete(callId);
}, 30000);

// Store timeout
set((state) => ({
  incomingCallTimeouts: new Map(state.incomingCallTimeouts).set(callId, timeout)
}));

// In answerCall and declineCall:
const timeout = get().incomingCallTimeouts.get(callId);
if (timeout) {
  clearTimeout(timeout);
  get().incomingCallTimeouts.delete(callId);
}
```

---

#### Bug #11: Duration Calculation May Be Negative 🟢 Low
**Lines**: 211-212  
**Severity**: 🟢 Low

```typescript
// ⚠️ PROBLEM:
const startTime = new Date(activeCall.startTime).getTime();
const duration = Math.floor((new Date(endTime).getTime() - startTime) / 1000);
// ❌ If clock changes or invalid date, could be negative
```

**Həll**:
```typescript
// ✅ FIX:
const startTime = new Date(activeCall.startTime).getTime();
if (isNaN(startTime)) {
  logger.error('Invalid call startTime');
  return;
}
const duration = Math.max(0, Math.floor((new Date(endTime).getTime() - startTime) / 1000));
```

---

## 📊 BUG XÜLASƏSI

```
╔═══════════════════════════════════════════════════════╗
║                 BUG STATISTICS                        ║
╠═══════════════════════════════════════════════════════╣
║                                                       ║
║  🔴 Critical:          2 bugs                        ║
║  🟡 Medium:            5 bugs                        ║
║  🟢 Low:               4 bugs                        ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║
║  📊 TOTAL:             11 bugs                       ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
```

### Priority Breakdown

| Module | Critical | Medium | Low | Total |
|--------|----------|--------|-----|-------|
| Call Screen | 1 | 2 | 1 | 4 |
| Call History | 0 | 2 | 0 | 2 |
| Call Store | 1 | 1 | 3 | 5 |

---

## 🎯 FIX PRIORITY

### Phase 1: Critical (HIGH PRIORITY) 🔴
1. ✅ Hardcoded user ID in call screen
2. ✅ Hardcoded user ID in store (3 places)

**Impact**: Multi-user support broken, production blocker!

---

### Phase 2: Medium Priority 🟡
3. ✅ Date calculation logic (today/yesterday)
4. ✅ Date validation
5. ✅ Camera resource cleanup
6. ✅ Incoming call timeout cleanup
7. ✅ Timer cleanup edge case

**Impact**: UX issues, resource leaks, potential bugs

---

### Phase 3: Low Priority 🟢
8. ✅ console.log → logger (2 places)
9. ✅ ID collision prevention
10. ✅ Duration validation

**Impact**: Code quality, rare edge cases

---

## 📋 DETAILED FIX PLAN

### 1. Fix Hardcoded User IDs
**Files**: `app/call/[id].tsx`, `store/callStore.ts`
- Import `useUserStore` in call screen
- Pass `currentUserId` to store functions
- Update all 4 hardcoded instances

---

### 2. Fix Date Logic
**File**: `app/call-history.tsx`
- Rewrite `formatDate` function
- Add date validation
- Use calendar day comparison, not time difference

---

### 3. Add Resource Cleanup
**File**: `app/call/[id].tsx`
- Add camera cleanup effect
- Ensure timers cleared properly

---

### 4. Fix Store Issues
**File**: `store/callStore.ts`
- Replace console.log with logger
- Add timeout tracking for incoming calls
- Clear timeouts on answer/decline
- Add unique ID generation
- Add duration validation

---

## 🚀 ESTIMATED TIME

- **Critical Fixes**: ~30 minutes
- **Medium Fixes**: ~45 minutes  
- **Low Fixes**: ~15 minutes
- **Testing**: ~30 minutes
- **TOTAL**: ~2 hours

---

**Status**: 🔧 Ready to fix  
**Priority**: HIGH (2 critical bugs block production!)  
**Risk**: Medium-High (call functionality is core feature)
