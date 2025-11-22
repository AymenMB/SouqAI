# Troubleshooting Guide

## Common Errors & Solutions

### 1. Gemini API 429 Error (Rate Limit)

**Error Message:**
```
Failed to load resource: the server responded with a status of 429
```

**Causes:**
- Free tier rate limits (15 requests per minute for Gemini)
- Quota exhausted
- Too many rapid requests

**Solutions:**

#### A. Check Your API Key Quota
1. Visit: https://aistudio.google.com/app/apikey
2. Check your current usage and limits
3. Verify your API key is valid

#### B. Automatic Retry (Already Implemented)
The app now automatically retries failed requests with exponential backoff:
- 1st retry: after 2 seconds
- 2nd retry: after 4 seconds
- 3rd retry: after 8 seconds
- etc.

#### C. Use Simpler Prompts
Complex prompts consume more quota. Try:
- Using preset styles (studio, lifestyle, outdoor, luxury) instead of custom prompts
- Avoiding very detailed custom descriptions
- Waiting a few minutes between generations

#### D. Upgrade Your API Key
For production use:
1. Enable billing in Google Cloud Console
2. Increase quota limits
3. Consider using paid tier for higher limits

---

### 2. Supabase 406 Error

**Error Message:**
```
Failed to load resource: the server responded with a status of 406
kcwmgexdqkmuxcgqsgmg.supabase.co/rest/v1/profiles
```

**Solution:**
✅ **FIXED** - Changed from `.single()` to `.maybeSingle()` to handle missing profiles gracefully.

**What was wrong:**
- `.single()` expects exactly one row and throws 406 if none found
- `.maybeSingle()` returns null if no row found (better for new users)

---

### 3. Image Generation Best Practices

#### Rate Limit Management
- **Wait between generations:** Allow 5-10 seconds between attempts
- **Batch operations:** Don't generate multiple products rapidly
- **Peak hours:** API might be slower during peak usage times

#### Optimal Settings
1. **First product:** Wait 30 seconds after app starts
2. **Style choices:**
   - ✅ Studio (fastest, simplest)
   - ✅ Lifestyle (moderate)
   - ⚠️ Luxury (complex, may take longer)
   - ⚠️ Custom (depends on complexity)

3. **Image quality:**
   - Use clear, well-lit original photos
   - Avoid very large images (resize to max 2048x2048)
   - JPG format recommended

---

### 4. Profile Creation Issues

**Symptoms:**
- 406 errors when fetching user profile
- Login successful but no user data

**Solution:**
✅ **FIXED** - Profile is now auto-created if missing during login/session check.

---

### 5. Environment Variables

**Check your .env file has:**
```env
GEMINI_API_KEY=your_actual_api_key_here
```

**Common mistakes:**
- ❌ Spaces around the `=` sign
- ❌ Quotes around the value
- ❌ Using the placeholder value
- ❌ File named `.env.txt` instead of `.env`

**Correct format:**
```env
GEMINI_API_KEY=AIzaSyABxrvuvFwD8isPKQXyXF0oxz1nJIqHvTU
```

---

## Monitoring API Usage

### Check Gemini API Quota
```
1. Go to: https://aistudio.google.com/app/apikey
2. Click on your API key
3. View "Usage" tab
4. Check:
   - Requests per minute: 15 (free tier)
   - Requests per day: 1,500 (free tier)
   - Tokens per minute: 32,000 (free tier)
```

### Free Tier Limits
- **Text Generation:** 15 RPM, 1M tokens/minute
- **Image Generation (Flash Image):** 15 RPM
- **Video Generation (Veo):** Very limited, may need paid tier

---

## Error Recovery Workflow

### If you get 429 errors:

1. **Wait 60 seconds** - Let the rate limit window reset
2. **Check quota** - Visit API console to see remaining quota
3. **Try again** - The retry logic will handle temporary limits
4. **Simplify** - Use preset styles instead of custom prompts
5. **Upgrade** - Consider enabling billing if needed frequently

### If errors persist:

1. **Check browser console** (F12) for detailed error messages
2. **Check network tab** to see exact API responses
3. **Verify API key** is active and valid
4. **Check Supabase** dashboard for database issues
5. **Restart dev server** to reload environment variables

---

## Performance Tips

1. **Optimize image uploads:**
   - Max size: 2MB
   - Format: JPG or PNG
   - Resolution: 1024x1024 to 2048x2048

2. **Reduce API calls:**
   - Preview before generating
   - Use cached results when possible
   - Batch operations when appropriate

3. **Better prompts:**
   - Be specific but concise
   - Use preset styles when possible
   - Avoid overly complex descriptions

---

## Getting Help

If problems persist:

1. **Check console logs** - Look for detailed error messages
2. **Review network tab** - See exact API requests/responses
3. **Test API key** - Try it directly in AI Studio
4. **Check Supabase** - Verify database connection
5. **Clear cache** - Delete `node_modules/.vite` and restart

## Contact & Resources

- **Gemini API Docs:** https://ai.google.dev/docs
- **Supabase Docs:** https://supabase.com/docs
- **Rate Limits:** https://ai.google.dev/pricing
