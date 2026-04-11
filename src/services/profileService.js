export const saveFullName = async (user, newName) => {
    if (newName === '') return;

    const res = await fetch(process.env.EXPO_PUBLIC_BACKEND_SERVER_URL + '/api/profile/update-name', {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${await user.getIdToken()}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newName })
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
};

export const saveDob = async (user, newDob) => {
    if (newDob === '') return;

    const res = await fetch(process.env.EXPO_PUBLIC_BACKEND_SERVER_URL + '/api/profile/update-date-of-birth', {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${await user.getIdToken()}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newDateOfBirth: newDob })
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
};

export const saveDefaultRestTimer = async (user, newRestTimer) => {
    if (newRestTimer === '') return;

    const res = await fetch(process.env.EXPO_PUBLIC_BACKEND_SERVER_URL + '/api/profile/update-default-rest-timer', {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${await user.getIdToken()}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newRestTimer: parseInt(newRestTimer) })
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
};

export const getDefaultRestTimer = async (user) => {
    const res = await fetch(process.env.EXPO_PUBLIC_BACKEND_SERVER_URL + '/api/profile/get-default-rest-timer', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${await user.getIdToken()}`,
        },
    });
    if (!res.ok) return 60;
    const data = await res.json();
    return data.defaultRestTimer ?? 60;
};

export const saveMeasurements = async (user, measurements) => {
    if (!measurements || Object.keys(measurements).length === 0) return;

    const res = await fetch(process.env.EXPO_PUBLIC_BACKEND_SERVER_URL + '/api/profile/body-measurements/update', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${await user.getIdToken()}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ bodyMeasurements: Object.entries(measurements).map(([key, value]) => ({ bodyType: key, measurementValue: parseFloat(value) })) })
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
};

export const addDailyGoal = async (user, goal) => {
    const res = await fetch(process.env.EXPO_PUBLIC_BACKEND_SERVER_URL + '/api/profile/daily-goals/add', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${await user.getIdToken()}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: goal })
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return data.goalId;
};

export const toggleDailyGoal = async (user, daily) => {
    const res = await fetch(process.env.EXPO_PUBLIC_BACKEND_SERVER_URL + '/api/profile/daily-goals/update', {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${await user.getIdToken()}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ goalId: daily.id, title: daily.text, achieved: daily.done })
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
};

export const deleteDailyGoal = async (user, goalId) => {
    const res = await fetch(process.env.EXPO_PUBLIC_BACKEND_SERVER_URL + '/api/profile/daily-goals/delete?goalId=' + goalId, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${await user.getIdToken()}`,
        },
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
};

export const addMonthlyGoal = async (user, goal) => {
    const res = await fetch(process.env.EXPO_PUBLIC_BACKEND_SERVER_URL + '/api/profile/monthly-goals/add', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${await user.getIdToken()}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: goal })
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return data.goalId;
};

export const toggleMonthlyGoal = async (user, monthly) => {
    const res = await fetch(process.env.EXPO_PUBLIC_BACKEND_SERVER_URL + '/api/profile/monthly-goals/update', {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${await user.getIdToken()}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ goalId: monthly.id, title: monthly.text, achieved: monthly.done })
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
};

export const deleteMonthlyGoal = async (user, goalId) => {
    const res = await fetch(process.env.EXPO_PUBLIC_BACKEND_SERVER_URL + '/api/profile/monthly-goals/delete?goalId=' + goalId, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${await user.getIdToken()}`,
        },
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
};

export const addYearlyGoal = async (user, goal) => {
    const res = await fetch(process.env.EXPO_PUBLIC_BACKEND_SERVER_URL + '/api/profile/yearly-goals/add', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${await user.getIdToken()}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: goal })
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return data.goalId;
};

export const toggleYearlyGoal = async (user, yearly) => {
    const res = await fetch(process.env.EXPO_PUBLIC_BACKEND_SERVER_URL + '/api/profile/yearly-goals/update', {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${await user.getIdToken()}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ goalId: yearly.id, title: yearly.text, achieved: yearly.done })
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
};

export const deleteYearlyGoal = async (user, goalId) => {
    const res = await fetch(process.env.EXPO_PUBLIC_BACKEND_SERVER_URL + '/api/profile/yearly-goals/delete?goalId=' + goalId, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${await user.getIdToken()}`,
        },
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
};
