# Performance Optimization Checklist

Use this checklist to verify all optimizations have been applied correctly.

## ✅ Installation Steps

- [ ] Install babel plugin:
  ```bash
  npm install --save-dev babel-plugin-transform-remove-console
  # or
  yarn add -D babel-plugin-transform-remove-console
  # or
  bun add -D babel-plugin-transform-remove-console
  ```

- [ ] Install dependencies:
  ```bash
  npm install
  ```

- [ ] Clear build cache:
  ```bash
  npx expo start --clear
  ```

## ✅ Configuration Files

### TypeScript (`tsconfig.json`)
- [x] moduleResolution: bundler
- [x] removeComments: true
- [x] skipLibCheck: true
- [x] sourceMap: false
- [x] declaration: false

### Babel (`babel.config.js`)
- [x] transform-remove-console plugin configured
- [x] Excludes console.error and console.warn
- [x] Only active in production

### Metro (`metro.config.js`)
- [x] Minification enabled
- [x] Console dropping configured
- [x] Hermes parser enabled
- [x] Comment removal enabled

### Expo (`app.json`)
- [x] jsEngine: hermes
- [x] newArchEnabled: true
- [x] assetBundlePatterns configured

## ✅ Code Optimizations

### React Components
- [x] ListingCard wrapped with React.memo
- [x] IncomingCallModal wrapped with React.memo
- [x] MessageModal wrapped with React.memo
- [x] All event handlers use useCallback
- [x] Expensive calculations use useMemo

### App Layout (`app/_layout.tsx`)
- [x] QueryClient created outside component
- [x] Colors memoized
- [x] Service initialization optimized
- [x] Font loading optimized (using system fonts)
- [x] Sound initialization delayed

### Home Screen (`app/(tabs)/index.tsx`)
- [x] Colors memoized
- [x] Featured listings memoized
- [x] Active stores memoized
- [x] Console logs wrapped in __DEV__

### tRPC Configuration (`lib/trpc.ts`)
- [x] Auth header caching (5s)
- [x] Query staleTime: 5 minutes
- [x] Query gcTime: 30 minutes
- [x] Refetch optimization
- [x] Retry logic with exponential backoff

### Image Optimization
- [x] Image optimization utility created
- [x] Cache policy: memory-disk
- [x] Transition: 200ms
- [x] Priority settings optimized
- [x] Preload functions available

## ✅ Testing Steps

### Development Testing
- [ ] Run `npm run typecheck` to verify TypeScript
- [ ] Run `npx expo start --clear` and verify app loads
- [ ] Check React DevTools Profiler for re-renders
- [ ] Verify images load correctly
- [ ] Test navigation performance

### Production Testing
- [ ] Build production bundle: `npx expo export`
- [ ] Check bundle size in export folder
- [ ] Verify console.logs are removed (check bundled JS)
- [ ] Test on physical device
- [ ] Measure startup time
- [ ] Profile memory usage

### Performance Metrics
- [ ] Initial load time < 2 seconds
- [ ] Screen navigation < 100ms
- [ ] Image loading < 500ms
- [ ] No unnecessary re-renders in lists
- [ ] Memory usage stable

## ✅ Verification Commands

Run the performance check script:
```bash
./scripts/check-performance.sh
```

Check TypeScript compilation:
```bash
npm run typecheck
```

Build for production:
```bash
npx expo export --platform all
```

Check bundle size:
```bash
du -sh dist/
```

## 📊 Expected Results

### Before Optimization
- Bundle size: ~5-7 MB
- Initial load: 1.5-2.5s
- Console logs: 623 statements
- Re-renders: Frequent and unnecessary

### After Optimization
- Bundle size: ~3.5-5 MB (25-30% reduction)
- Initial load: 1.0-2.0s (300-500ms faster)
- Console logs: 0 in production
- Re-renders: 60-80% reduction

## 🐛 Troubleshooting

### Build Errors
If you see build errors:
1. Clear node_modules: `rm -rf node_modules && npm install`
2. Clear Expo cache: `npx expo start --clear`
3. Clear Metro cache: `rm -rf .expo`

### Runtime Errors
If app crashes:
1. Check console for errors (console.error still works)
2. Verify babel plugin is installed correctly
3. Check that React.memo dependencies are correct
4. Verify useCallback/useMemo dependencies

### Performance Issues
If performance didn't improve:
1. Profile with React DevTools
2. Check network requests (React Query cache might need adjustment)
3. Verify Hermes is actually running
4. Check image cache settings

## 📈 Monitoring

After deployment, monitor:
- [ ] App startup time
- [ ] Bundle download time
- [ ] Memory usage over time
- [ ] Crash rate
- [ ] User engagement metrics

## 🎯 Success Criteria

- ✅ All checklist items completed
- ✅ TypeScript compiles without errors
- ✅ App runs in development mode
- ✅ Production build succeeds
- ✅ Bundle size reduced by >20%
- ✅ Load time reduced by >200ms
- ✅ No console.logs in production bundle
- ✅ React DevTools shows fewer re-renders

---

**Last Updated**: 2025-10-14
**Status**: All optimizations applied ✅
