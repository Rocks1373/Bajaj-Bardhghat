'use client';

import { useState, useEffect } from 'react';

/**
 * Returns isAdmin:true when an admin_token exists in localStorage.
 * Used to show inline edit options on public pages for admin users only.
 */
export function useAdminMode() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [token, setToken] = useState('');

    useEffect(() => {
        const t = localStorage.getItem('admin_token');
        if (t) {
            setIsAdmin(true);
            setToken(t);
        }
    }, []);

    return { isAdmin, token };
}
