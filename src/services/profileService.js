export const saveFullName = async (user, newName) => {
    if(newName === "")
        return;

    console.log('Saving full name:', newName);

    // Save full name to backend
    fetch(process.env.EXPO_PUBLIC_BACKEND_SERVER_URL + '/api/profile/update-name', {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${await user.getIdToken()}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newName: newName })
    }).then(res => res.json()).then(data => {
        console.log('Full name updated successfully:', data);
    }).catch(err => {
        console.error('Failed to update full name:', err);
    });
};

export const saveDob = async (user, newDob) => {
    if(newDob === "") return;

    fetch(process.env.EXPO_PUBLIC_BACKEND_SERVER_URL + '/api/profile/update-date-of-birth', {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${await user.getIdToken()}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newDateOfBirth: newDob })
    }).then(res => res.json()).then(data => {
        console.log('Date of birth updated successfully:', data);
    }).catch(err => {
        console.error('Failed to update date of birth:', err);
    });
};

export const saveMeasurements = async (user, measurements) => {
    if (!measurements || Object.keys(measurements).length === 0) return;

    console.log(measurements);

    try {
        const res = await fetch(process.env.EXPO_PUBLIC_BACKEND_SERVER_URL + '/api/profile/body-measurements/update', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${await user.getIdToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ bodyMeasurements: Object.entries(measurements).map(([key, value]) => ({ bodyType: key, measurementValue: parseFloat(value) })) })
        });
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        console.log('Body measurements updated successfully');
    } catch (err) {
        console.error('Failed to update body measurements:', err);
    }
};

export const addDailyGoal = async (user, goal, setDailyGoalFunc) => {
    fetch(process.env.EXPO_PUBLIC_BACKEND_SERVER_URL + '/api/profile/daily-goals/add', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${await user.getIdToken()}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: goal })
    }).then(res => res.json()).then(data => {
        console.log('Daily goal added successfully:', data);
        setDailyGoalFunc((prev) => [...prev, { id: data.goalId, text: goal, done: false }]);
    }).catch(err => {
        console.error('Failed to add daily goal:', err);
    });
};

export const toggleDailyGoal = async (user, daily) => {
    fetch(process.env.EXPO_PUBLIC_BACKEND_SERVER_URL + '/api/profile/daily-goals/update', {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${await user.getIdToken()}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ goalId: daily.id, title: daily.text, achieved: daily.done })
    }).then(res => res.json()).then(data => {
        console.log('Daily goal updated successfully:', data);
    }).catch(err => {
        console.error('Failed to update daily goal:', err);
    });
};

export const deleteDailyGoal = async (user, goalId, setDailyGoalFunc) => {
    fetch(process.env.EXPO_PUBLIC_BACKEND_SERVER_URL + '/api/profile/daily-goals/delete?goalId=' + goalId, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${await user.getIdToken()}`,
        },
    }).then(res => {
        if (res.ok) {
            setDailyGoalFunc((prev) => prev.filter(goal => goal.id !== goalId));
        }
    }).catch(err => {
        console.error('Failed to delete daily goal:', err);
    });
};

export const addMonthlyGoal = async (user, goal, setMonthlyGoalFunc) => {
    fetch(process.env.EXPO_PUBLIC_BACKEND_SERVER_URL + '/api/profile/monthly-goals/add', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${await user.getIdToken()}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: goal })
    }).then(res => res.json()).then(data => {
        console.log('Monthly goal added successfully:', data);
        setMonthlyGoalFunc((prev) => [...prev, { id: data.goalId, text: goal, done: false }]);
    }).catch(err => {
        console.error('Failed to add monthly goal:', err);
    });
};

export const toggleMonthlyGoal = async (user, monthly) => {
    fetch(process.env.EXPO_PUBLIC_BACKEND_SERVER_URL + '/api/profile/monthly-goals/update', {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${await user.getIdToken()}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ goalId: monthly.id, title: monthly.text, achieved: monthly.done })
    }).then(res => res.json()).then(data => {
        console.log('Monthly goal updated successfully:', data);
    }).catch(err => {
        console.error('Failed to update monthly goal:', err);
    });
};

export const deleteMonthlyGoal = async (user, goalId, setMonthlyGoalFunc) => {
    fetch(process.env.EXPO_PUBLIC_BACKEND_SERVER_URL + '/api/profile/monthly-goals/delete?goalId=' + goalId, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${await user.getIdToken()}`,
        },
    }).then(res => {
        if (res.ok) {
            setMonthlyGoalFunc((prev) => prev.filter(goal => goal.id !== goalId));
        }
    }).catch(err => {
        console.error('Failed to delete monthly goal:', err);
    });
};

export const addYearlyGoal = async (user, goal, setYearlyGoalFunc) => {
    fetch(process.env.EXPO_PUBLIC_BACKEND_SERVER_URL + '/api/profile/yearly-goals/add', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${await user.getIdToken()}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: goal })
    }).then(res => res.json()).then(data => {
        console.log('Yearly goal added successfully:', data);
        setYearlyGoalFunc((prev) => [...prev, { id: data.goalId, text: goal, done: false }]);
    }).catch(err => {
        console.error('Failed to add yearly goal:', err);
    });
};

export const toggleYearlyGoal = async (user, yearly) => {
    fetch(process.env.EXPO_PUBLIC_BACKEND_SERVER_URL + '/api/profile/yearly-goals/update', {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${await user.getIdToken()}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ goalId: yearly.id, title: yearly.text, achieved: yearly.done })
    }).then(res => res.json()).then(data => {
        console.log('Yearly goal updated successfully:', data);
    }).catch(err => {
        console.error('Failed to update yearly goal:', err);
    });
};

export const deleteYearlyGoal = async (user, goalId, setYearlyGoalFunc) => {
    fetch(process.env.EXPO_PUBLIC_BACKEND_SERVER_URL + '/api/profile/yearly-goals/delete?goalId=' + goalId, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${await user.getIdToken()}`,
        },
    }).then(res => {
        if (res.ok) {
            setYearlyGoalFunc((prev) => prev.filter(goal => goal.id !== goalId));
        }
    }).catch(err => {
        console.error('Failed to delete yearly goal:', err);
    });
};