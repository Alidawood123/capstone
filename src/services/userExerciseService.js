// Service to manage user-created exercises. Uses AsyncStorage on all platforms
// (iOS, Android, web) so it works in React Native/Expo. Keeps an in-memory cache
// so getUserExercises() can stay synchronous for existing callers.

import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_EXERCISES_KEY = 'userExercises';

// In-memory cache so sync getter works; populated by initUserExercisesCache().
let cachedUserExercises = null;

/**
 * Load user exercises from AsyncStorage into the cache. Call once at app start
 * (e.g. from ensureExercisesLoaded) so search/list have data.
 */
export const initUserExercisesCache = async () => {
  try {
    const stored = await AsyncStorage.getItem(USER_EXERCISES_KEY);
    cachedUserExercises = stored ? JSON.parse(stored) : [];
    return cachedUserExercises;
  } catch (error) {
    console.error('Error reading user exercises:', error);
    cachedUserExercises = [];
    return cachedUserExercises;
  }
};

const persistCache = (list) => {
  AsyncStorage.setItem(USER_EXERCISES_KEY, JSON.stringify(list)).catch((err) =>
    console.error('Error saving user exercises:', err)
  );
};

export const getUserExercises = () => {
  if (cachedUserExercises === null) {
    return [];
  }
  return cachedUserExercises;
};

export const addUserExercise = (exercise) => {
  const userExercises = [...getUserExercises()];

  const newId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const newExercise = {
    id: newId,
    title: exercise.title || '',
    description: exercise.description || '',
    type: exercise.type || '',
    bodyPart: exercise.bodyPart || '',
    level: exercise.level || '',
    equipment: exercise.equipment || '',
    isUserCreated: true,
  };

  userExercises.push(newExercise);
  cachedUserExercises = userExercises;
  persistCache(userExercises);

  return newExercise;
};

export const deleteUserExercise = (id) => {
  const filtered = getUserExercises().filter((e) => e.id !== id);
  cachedUserExercises = filtered;
  persistCache(filtered);
};

export const updateUserExercise = (id, updates) => {
  const userExercises = [...getUserExercises()];
  const index = userExercises.findIndex((e) => e.id === id);

  if (index !== -1) {
    userExercises[index] = {
      ...userExercises[index],
      ...updates,
    };
    cachedUserExercises = userExercises;
    persistCache(userExercises);
    return userExercises[index];
  }

  return null;
};

export const clearAllUserExercises = () => {
  cachedUserExercises = [];
  AsyncStorage.removeItem(USER_EXERCISES_KEY).catch((err) =>
    console.error('Error clearing user exercises:', err)
  );
};
