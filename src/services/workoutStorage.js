import AsyncStorage from '@react-native-async-storage/async-storage';

const WORKOUTS_KEY = 'arc_workouts';

/**
 * Get all stored workouts.
 * @returns {Promise<Array>} List of workout objects; [] on missing/invalid data or error.
 */
export const getWorkouts = async (user) => {
  // try {
  //   const stored = await AsyncStorage.getItem(WORKOUTS_KEY);
  //   if (stored == null) return [];
  //   const parsed = JSON.parse(stored);
  //   return Array.isArray(parsed) ? parsed : [];
  // } catch (error) {
  //   console.error('Error reading workouts:', error);
  //   return [];
  // }

  try{
    const res = await fetch(process.env.EXPO_PUBLIC_BACKEND_SERVER_URL + '/api/workout-history/get-history', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${await user.getIdToken()}`,
        'Content-Type': 'application/json'
      },
    });

    if(!res.ok)
    {
      console.log(res);
    }

    const data = await res.json();
    console.log(data);
    return Array.isArray(data) ? data : [];
  }
  catch(error) {
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
  // try {
  //   const existing = await getWorkouts();
  //   existing.push(workout);
  //   await saveWorkouts(existing);
  // } catch (error) {
  //   console.error('Error adding workout:', error);
  // }

  try{
    const res = await fetch(process.env.EXPO_PUBLIC_BACKEND_SERVER_URL + '/api/workout-history/add-history', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await user.getIdToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(workout)
    });

    if(!res.ok)
    {
      console.log(res);
    }
  }
  catch (error) {
    console.error('Error adding workout:', error);
  }
};
