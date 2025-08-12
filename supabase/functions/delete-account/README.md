# Delete Account Function

This Supabase Edge Function handles secure account deletion for the Logday app.

## Security Features

- **Password Re-verification**: Requires user to enter current password before deletion
- **JWT Token Validation**: Verifies user identity through Supabase auth
- **Data Cleanup**: Removes all user data from custom tables before deleting auth record
- **Audit Logging**: Logs deletion attempts for security monitoring
- **Error Handling**: Comprehensive error handling with user-friendly messages

## Data Deleted

The function removes all user-associated data including:
- Workout logs (`workout_logs`)
- Custom routines (`routines`)
- Custom exercises (`custom_exercises`)
- User settings (`user_settings`)
- Auth record (`auth.users`)

## Deployment

To deploy this function:

```bash
# Deploy the function
supabase functions deploy delete-account

# The function will be available at:
# https://YOUR_PROJECT.supabase.co/functions/v1/delete-account
```

## Environment Variables

The function uses these automatically available environment variables:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Usage

The function is called from the frontend via:
```typescript
const { error } = await supabase.functions.invoke('delete-account', {
  body: { password: userPassword }
});
```

## Error Responses

- `401`: Invalid authorization or missing auth header
- `400`: Missing password or invalid password
- `500`: Server error during deletion process