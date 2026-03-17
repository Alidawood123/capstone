import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BarChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth } from '@react-native-firebase/auth';
import { getWorkouts } from '../../services/workoutStorage';
import { ensureExercisesLoaded, searchExercises } from '../../services/exerciseParser';
import Toast from 'react-native-toast-message';

const screenWidth = Dimensions.get('window').width;

export default function FitnessAnalyticsContent({ onNavigateToLanding }) {
  const [workouts, setWorkouts] = useState([]);
  const [personalBests, setPersonalBests] = useState({});
  const [loading, setLoading] = useState(true);
  const [showPBModal, setShowPBModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [pbWeight, setPBWeight] = useState('');
  const [pbReps, setPBReps] = useState('');
  const [exerciseSearch, setExerciseSearch] = useState('');
  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  // Load workouts and personal bests on component mount
  useEffect(() => {
    if (userId) {
      ensureExercisesLoaded().then(() => loadData());
    }
  }, [userId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load workouts from workout storage
      const workoutsData = await getWorkouts();
      setWorkouts(workoutsData);

      // Load personal bests
      const pbData = await AsyncStorage.getItem(`personalBests_${userId}`);
      const parsedPB = pbData ? JSON.parse(pbData) : {};
      setPersonalBests(parsedPB);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load analytics data',
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate total workouts
  const totalWorkouts = workouts.length;

  // Calculate consecutive days worked out
  const getConsecutiveDays = () => {
    if (workouts.length === 0) return 0;
    
    const sortedDates = workouts
      .map(w => new Date(w.date).setHours(0, 0, 0, 0))
      .sort((a, b) => b - a);
    
    let consecutiveDays = 1;
    const today = new Date().setHours(0, 0, 0, 0);
    
    // Check if user worked out today or yesterday
    if (sortedDates[0] !== today && sortedDates[0] !== today - 24 * 60 * 60 * 1000) {
      return 0;
    }

    for (let i = 1; i < sortedDates.length; i++) {
      const dayDifference = (sortedDates[i - 1] - sortedDates[i]) / (24 * 60 * 60 * 1000);
      if (dayDifference === 1) {
        consecutiveDays++;
      } else {
        break;
      }
    }
    
    return consecutiveDays;
  };

  // Calculate average workout duration
  const getAverageDuration = () => {
    if (workouts.length === 0) return 0;
    const totalDuration = workouts.reduce((sum, w) => sum + (w.durationSeconds || 0), 0);
    return Math.round(totalDuration / workouts.length / 60); // Convert to minutes
  };

  // Calculate total weight moved
  const getTotalWeightMoved = () => {
    if (workouts.length === 0) return 0;
    return workouts.reduce((total, workout) => {
      const workoutWeight = (workout.exercises || []).reduce((sum, item) => {
        // Each item in exercises array has a 'sets' array with weight, reps data
        const itemWeight = (item.sets || []).reduce((setSums, set) => {
          const weight = parseFloat(set.weight) || 0;
          const reps = parseFloat(set.reps) || 0;
          return setSums + (weight * reps);
        }, 0);
        return sum + itemWeight;
      }, 0);
      return total + workoutWeight;
    }, 0);
  };

  // Get workouts per month
  const getWorkoutsPerMonth = () => {
    const monthData = {};
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    workouts.forEach(workout => {
      const date = new Date(workout.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      monthData[monthKey] = (monthData[monthKey] || 0) + 1;
    });

    // Show all 12 months of the current year
    const labels = monthLabels;
    const data = [];
    
    for (let month = 0; month < 12; month++) {
      const monthKey = `${currentYear}-${month}`;
      data.push(monthData[monthKey] || 0);
    }

    return {
      labels: labels,
      datasets: [{
        data: data,
      }],
    };
  };

  // Get weight moved per exercise
  const getWeightPerExercise = () => {
    const exerciseWeights = {};
    
    workouts.forEach(workout => {
      (workout.exercises || []).forEach(item => {
        // Get exercise name from the first exercise in the item
        const exerciseObj = (item.exercises && item.exercises[0]) || {};
        const exerciseName = exerciseObj.title || 'Unknown';
        
        // Sum weight from all sets in this item
        const itemWeight = (item.sets || []).reduce((sum, set) => {
          const weight = parseFloat(set.weight) || 0;
          const reps = parseFloat(set.reps) || 0;
          return sum + (weight * reps);
        }, 0);
        
        exerciseWeights[exerciseName] = (exerciseWeights[exerciseName] || 0) + itemWeight;
      });
    });

    const sortedExercises = Object.entries(exerciseWeights)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const labels = sortedExercises.map(([name]) => name.substring(0, 10));
    const data = sortedExercises.map(([, weight]) => Math.round(weight));

    return {
      labels: labels.length > 0 ? labels : ['No Data'],
      datasets: [{
        data: data.length > 0 ? data : [0],
      }],
    };
  };

  // Get exercise statistics with total weight and reps
  const getExerciseStats = () => {
    const exerciseStats = {};
    
    workouts.forEach(workout => {
      (workout.exercises || []).forEach(item => {
        // Get exercise name from the first exercise in the item
        const exerciseObj = (item.exercises && item.exercises[0]) || {};
        const exerciseName = exerciseObj.title || 'Unknown';
        
        if (!exerciseStats[exerciseName]) {
          exerciseStats[exerciseName] = { maxWeight: 0, totalWeight: 0, reps: 0 };
        }
        
        // Sum weight and reps from all sets in this item, track max weight
        (item.sets || []).forEach(set => {
          const weight = parseFloat(set.weight) || 0;
          const reps = parseFloat(set.reps) || 0;
          exerciseStats[exerciseName].totalWeight += weight * reps;
          exerciseStats[exerciseName].reps += reps;
          exerciseStats[exerciseName].maxWeight = Math.max(exerciseStats[exerciseName].maxWeight, weight);
        });
      });
    });

    return Object.entries(exerciseStats)
      .map(([name, stats]) => ({
        name,
        maxWeight: Math.round(stats.maxWeight),
        totalWeight: Math.round(stats.totalWeight),
        reps: stats.reps,
      }))
      .sort((a, b) => b.totalWeight - a.totalWeight);
  };

  const handleAddPersonalBest = async () => {
    if (!selectedExercise || !pbWeight || !pbReps) {
      Alert.alert('Error', 'Please select an exercise, enter weight, and enter reps');
      return;
    }

    try {
      const weight = parseFloat(pbWeight);
      const reps = parseInt(pbReps, 10);
      if (isNaN(weight) || isNaN(reps)) {
        Alert.alert('Error', 'Please enter valid weight and reps');
        return;
      }

      const updatedPB = {
        ...personalBests,
        [selectedExercise.id]: {
          exerciseName: selectedExercise.title,
          weight: weight,
          reps: reps,
          date: new Date().toISOString(),
        },
      };

      await AsyncStorage.setItem(`personalBests_${userId}`, JSON.stringify(updatedPB));
      setPersonalBests(updatedPB);
      setPBWeight('');
      setPBReps('');
      setSelectedExercise(null);
      setExerciseSearch('');
      setShowPBModal(false);

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: `Personal best added for ${selectedExercise.title}`,
      });
    } catch (error) {
      console.error('Error saving personal best:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save personal best',
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00b4d8" />
      </View>
    );
  }

  const allExercises = searchExercises('');
  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(0, 180, 216, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    decimalPlaces: 0,
    propsForBackgroundLines: {
      strokeDasharray: '',
    },
  };

  // Calculate appropriate yMax for the chart with 5-unit increments
  const getChartYMax = () => {
    const maxWorkouts = Math.max(...getWorkoutsPerMonth().datasets[0].data, 0);
    // Round up to nearest multiple of 5
    return Math.ceil((maxWorkouts + 1) / 5) * 5;
  };

  // Calculate number of segments for yaxis (one segment per 5 units)
  const getChartSegments = () => {
    return Math.ceil(getChartYMax() / 5);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Analytics Cards */}
      <View style={styles.analyticsGrid}>
        <View style={styles.card}>
          <Ionicons name="fitness" size={32} color="#00b4d8" />
          <Text style={styles.cardValue}>{totalWorkouts}</Text>
          <Text style={styles.cardLabel}>Total Workouts</Text>
        </View>

        <View style={styles.card}>
          <Ionicons name="flame" size={32} color="#ff6b6b" />
          <Text style={styles.cardValue}>{getConsecutiveDays()}</Text>
          <Text style={styles.cardLabel}>Consecutive Days</Text>
        </View>

        <View style={styles.card}>
          <Ionicons name="time" size={32} color="#ffd93d" />
          <Text style={styles.cardValue}>{getAverageDuration()}</Text>
          <Text style={styles.cardLabel}>Avg Duration (min)</Text>
        </View>

        <View style={styles.card}>
          <Ionicons name="barbell" size={32} color="#6bcf7f" />
          <Text style={styles.cardValue}>{Math.round(getTotalWeightMoved())}</Text>
          <Text style={styles.cardLabel}>Total Weight (lbs)</Text>
        </View>
      </View>

      {/* Workouts Per Month Chart */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Workouts Per Month</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <BarChart
            data={getWorkoutsPerMonth()}
            width={Math.max(screenWidth - 60, 300)}
            height={220}
            chartConfig={{
              ...chartConfig,
              segments: getChartSegments(),
            }}
            yMin={0}
            yMax={getChartYMax()}
            style={styles.chart}
          />
        </ScrollView>
      </View>

      {/* Personal Bests Section */}
      <View style={styles.pbSection}>
        <View style={styles.pbHeader}>
          <Text style={styles.chartTitle}>Personal Bests</Text>
          <Pressable
            style={styles.addButton}
            onPress={() => setShowPBModal(true)}
          >
            <Ionicons name="add" size={24} color="white" />
          </Pressable>
        </View>

        {Object.entries(personalBests).length > 0 ? (
          Object.entries(personalBests).map(([exerciseId, pb]) => (
            <View key={exerciseId} style={styles.pbCard}>
              <View>
                <Text style={styles.pbExerciseName}>{pb.exerciseName}</Text>
                <Text style={styles.pbDate}>
                  {new Date(pb.date).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.pbStatsContainer}>
                <Text style={styles.pbWeight}>{pb.weight} lbs</Text>
                {pb.reps && <Text style={styles.pbReps}>× {pb.reps}</Text>}
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No personal bests recorded yet</Text>
        )}
      </View>

      {/* Exercise Statistics Section */}
      <View style={styles.pbSection}>
        <Text style={styles.chartTitle}>Totals By Exercise</Text>
        {getExerciseStats().length > 0 ? (
          getExerciseStats().map((exercise, index) => (
            <View key={index} style={styles.exerciseStatCard}>
              <View style={styles.exerciseNameAndStats}>
                <Text style={styles.pbExerciseName}>{exercise.name}</Text>
                <View style={styles.statRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Max Weight:</Text>
                    <Text style={styles.statValue}>{exercise.maxWeight} lbs</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Total Reps:</Text>
                    <Text style={styles.statValue}>{exercise.reps}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.exerciseTotalWeight}>
                <Text style={styles.statLabel}>Total Weight:</Text>
                <Text style={styles.statValueLarge}>{exercise.totalWeight} lbs</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No exercise data available</Text>
        )}
      </View>

      {/* Personal Best Modal */}
      <Modal
        visible={showPBModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPBModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Personal Best</Text>
              <Pressable onPress={() => {
                setShowPBModal(false);
                setExerciseSearch('');
                setPBWeight('');
                setPBReps('');
              }}>
                <Ionicons name="close" size={28} color="#333" />
              </Pressable>
            </View>

            {/* Exercise Search */}
            <Text style={styles.modalLabel}>Search Exercise</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Type exercise name..."
              value={exerciseSearch}
              onChangeText={setExerciseSearch}
              placeholderTextColor="#999"
            />

            {/* Exercise Selection */}
            <Text style={styles.modalLabel}>Select Exercise</Text>
            <ScrollView style={styles.exerciseList} nestedScrollEnabled>
              {allExercises
                .filter(exercise =>
                  exercise.title.toLowerCase().includes(exerciseSearch.toLowerCase())
                )
                .map(exercise => (
                <Pressable
                  key={exercise.id}
                  style={[
                    styles.exerciseOption,
                    selectedExercise?.id === exercise.id && styles.exerciseOptionSelected,
                  ]}
                  onPress={() => setSelectedExercise(exercise)}
                >
                  <Text
                    style={[
                      styles.exerciseOptionText,
                      selectedExercise?.id === exercise.id && styles.exerciseOptionTextSelected,
                    ]}
                  >
                    {exercise.title}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Weight Input */}
            <Text style={styles.modalLabel}>Weight (lbs)</Text>
            <TextInput
              style={styles.weightInput}
              placeholder="Enter weight"
              keyboardType="decimal-pad"
              value={pbWeight}
              onChangeText={setPBWeight}
            />

            {/* Reps Input */}
            <Text style={styles.modalLabel}>Reps</Text>
            <TextInput
              style={styles.weightInput}
              placeholder="Enter reps"
              keyboardType="number-pad"
              value={pbReps}
              onChangeText={setPBReps}
            />

            {/* Action Buttons */}
            <View style={styles.modalButtons}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => {
                  setShowPBModal(false);
                  setExerciseSearch('');
                  setPBWeight('');
                  setPBReps('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.saveButton}
                onPress={handleAddPersonalBest}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },

  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    paddingTop: 30,
    gap: 10,
  },
  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00b4d8',
    marginTop: 10,
  },
  cardLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 15,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  chart: {
    marginLeft: -23,
    marginRight: 0,
  },
  noDataContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    color: '#999',
    fontSize: 14,
  },
  pbSection: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 15,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pbHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  addButton: {
    backgroundColor: '#00b4d8',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pbCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 10,
  },
  exerciseStatCard: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseNameAndStats: {
    flex: 1,
  },
  exerciseTotalWeight: {
    alignItems: 'flex-end',
    paddingLeft: 10,
  },
  statRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 8,
  },
  pbExerciseName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  pbDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  pbWeight: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00b4d8',
  },
  pbStatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  pbReps: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  statValueLarge: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00b4d8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 15,
    color: '#333',
  },
  exerciseList: {
    maxHeight: 150,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
  },
  exerciseOption: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  exerciseOptionSelected: {
    backgroundColor: '#e3f2fd',
  },
  exerciseOptionText: {
    fontSize: 14,
    color: '#333',
  },
  exerciseOptionTextSelected: {
    color: '#00b4d8',
    fontWeight: '600',
  },
  weightInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00b4d8',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#00b4d8',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#00b4d8',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  spacer: {
    height: 40,
  },
});
