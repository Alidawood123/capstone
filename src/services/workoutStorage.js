import AsyncStorage from '@react-native-async-storage/async-storage';

const WORKOUTS_KEY = 'arc_workouts';

/**
 * Get all stored workouts.
 * @returns {Promise<Array>} List of workout objects; [] on missing/invalid data or error.
 */
export const getWorkouts = async (user) => {
  try {
    const res = await fetch(process.env.EXPO_PUBLIC_BACKEND_SERVER_URL + '/api/workout-history/get-history', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${await user.getIdToken()}`,
        'Content-Type': 'application/json'
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }
  catch (error) {
    console.error('Error fetching workouts from backend:', error);
    return [];
  }
};

/**
 * Overwrite stored workouts with the given array.
 * @param {Array} workouts - Full list of workouts to save.
 * @returns {Promise<void>}
 */
export const saveWorkouts = async (workouts) => {
  try {
    await AsyncStorage.setItem(WORKOUTS_KEY, JSON.stringify(workouts));
  } catch (error) {
    console.error('Error saving workouts:', error);
    throw error;
  }
};

/**
 * Append a single workout to stored workouts.
 * @param {Object} user - user object from the getAuth of Firebase.
 * @param {Object} workout - Workout object to add (title, date, durationSeconds, completedAt, exercises).
 * @returns {Promise<void>}
 */
export const addWorkout = async (user, workout) => {
  const res = await fetch(process.env.EXPO_PUBLIC_BACKEND_SERVER_URL + '/api/workout-history/add-history', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${await user.getIdToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(workout)
  });

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
};

export const updateWorkout = async (user, workoutId, updatedWorkout) => {
  const res = await fetch(process.env.EXPO_PUBLIC_BACKEND_SERVER_URL + '/api/workout-history/update-history?workoutId=' + workoutId, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${await user.getIdToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title: updatedWorkout.title, notes: updatedWorkout.notes || '', exercises: updatedWorkout.exercises })
  });

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
};

export const removeWorkout = async (user, workoutId) => {
  const res = await fetch(process.env.EXPO_PUBLIC_BACKEND_SERVER_URL + '/api/workout-history/delete-history?workoutId=' + workoutId, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${await user.getIdToken()}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
};
