-- Add admin role for martongabor818@gmail.com
-- First, we need to find the user ID for this email and then add the admin role

DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Find the user ID for the specified email
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = 'martongabor818@gmail.com' 
    LIMIT 1;
    
    -- Check if user exists
    IF target_user_id IS NOT NULL THEN
        -- Insert admin role for this user (ignore if already exists)
        INSERT INTO public.user_roles (user_id, role)
        VALUES (target_user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
        
        RAISE NOTICE 'Admin role granted to user: %', target_user_id;
    ELSE
        RAISE NOTICE 'User with email martongabor818@gmail.com not found. Please make sure the user has signed up first.';
    END IF;
END $$;