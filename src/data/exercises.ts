import { Exercise } from '../types/workout';

export const exercises: Exercise[] = [
  // Shoulders
  { id: 's1', name: 'Seated Shoulder Press (Dumbbells)', muscleGroup: 'Shoulders' },
  { id: 's2', name: 'Seated Shoulder Press (Barbell)', muscleGroup: 'Shoulders' },
  { id: 's3', name: 'Seated Shoulder Press (Smith Machine)', muscleGroup: 'Shoulders' },
  { id: 's4', name: 'Seated Shoulder Press (Machine)', muscleGroup: 'Shoulders' },
  { id: 's5', name: 'Seated Iso Shoulder Press (Hammer)', muscleGroup: 'Shoulders' },
  { id: 's6', name: 'Standing Military Press (Barbell)', muscleGroup: 'Shoulders' },
  { id: 's7', name: 'Standing Military Press (Smith Machine)', muscleGroup: 'Shoulders' },
  { id: 's8', name: 'Arnold Press (Dumbbells)', muscleGroup: 'Shoulders' },
  { id: 's9', name: 'Standing Lateral Raises (Dumbbells)', muscleGroup: 'Shoulders' },
  { id: 's10', name: 'Standing Lateral Raises (Cables)', muscleGroup: 'Shoulders' },
  { id: 's11', name: 'Seated Lateral Raises (Dumbbells)', muscleGroup: 'Shoulders' },
  { id: 's12', name: 'Seated Lateral Raises (Machine)', muscleGroup: 'Shoulders' },
  { id: 's13', name: 'Seated Lateral Raises (Hammer)', muscleGroup: 'Shoulders' },
  { id: 's14', name: 'Standing Lateral Raises (Machine)', muscleGroup: 'Shoulders' },
  { id: 's15', name: 'Standing Lateral Raises (Hammer)', muscleGroup: 'Shoulders' },
  { id: 's16', name: 'Rear Delt Fly (Machine)', muscleGroup: 'Shoulders' },
  { id: 's17', name: 'Single-Arm Rear Delt Fly (Machine)', muscleGroup: 'Shoulders' },
  { id: 's18', name: 'Rear Delt Fly (Cables)', muscleGroup: 'Shoulders' },
  { id: 's19', name: 'Lying Rear Delt Raises (Hammer)', muscleGroup: 'Shoulders' },
  { id: 's20', name: 'Bent-over Rear Delt Raises (Hammer)', muscleGroup: 'Shoulders' },
  { id: 's21', name: 'Bent-over Rear Delt Raises (Machine)', muscleGroup: 'Shoulders' },
  { id: 's22', name: 'Bent-over Rear Delt Raises (Dumbbells)', muscleGroup: 'Shoulders' },

  // Chest
  { id: 'c1', name: 'Pushups', muscleGroup: 'Chest' },
  { id: 'c2', name: 'Flat Chest Press (Dumbbell)', muscleGroup: 'Chest' },
  { id: 'c3', name: 'Incline Chest Press (Dumbbell)', muscleGroup: 'Chest' },
  { id: 'c4', name: 'Decline Chest Press (Dumbbell)', muscleGroup: 'Chest' },
  { id: 'c5', name: 'Flat Chest Press (Smith)', muscleGroup: 'Chest' },
  { id: 'c6', name: 'Incline Chest Press (Smith)', muscleGroup: 'Chest' },
  { id: 'c7', name: 'Decline Chest Press (Smith)', muscleGroup: 'Chest' },
  { id: 'c8', name: 'Flat Chest Press (Bench)', muscleGroup: 'Chest' },
  { id: 'c9', name: 'Incline Chest Press (Bench)', muscleGroup: 'Chest' },
  { id: 'c10', name: 'Decline Chest Press (Bench)', muscleGroup: 'Chest' },
  { id: 'c11', name: 'Flat Iso Chest Press (Hammer)', muscleGroup: 'Chest' },
  { id: 'c12', name: 'Incline Iso Chest Press (Hammer)', muscleGroup: 'Chest' },
  { id: 'c13', name: 'Decline Iso Chest Press (Hammer)', muscleGroup: 'Chest' },
  { id: 'c14', name: 'Cable Flies (Low to High)', muscleGroup: 'Chest' },
  { id: 'c15', name: 'Cable Flies (High to Low)', muscleGroup: 'Chest' },
  { id: 'c16', name: 'Cable Flies (Arm-level)', muscleGroup: 'Chest' },
  { id: 'c17', name: 'Incline Flies (Dumbbell)', muscleGroup: 'Chest' },
  { id: 'c18', name: 'Incline Flies (Cable)', muscleGroup: 'Chest' },
  { id: 'c19', name: 'Decline Flies (Dumbbell)', muscleGroup: 'Chest' },
  { id: 'c20', name: 'Decline Flies (Cable)', muscleGroup: 'Chest' },
  { id: 'c21', name: 'Pec Deck (Single Pulley)', muscleGroup: 'Chest' },
  { id: 'c22', name: 'Pec Deck (Dual Pulley)', muscleGroup: 'Chest' },
  { id: 'c23', name: 'Dips', muscleGroup: 'Chest' },

  // Back
  { id: 'b1', name: 'Lat Pulldown - Wide', muscleGroup: 'Back' },
  { id: 'b2', name: 'Lat Pulldown - Wide (Maggrip)', muscleGroup: 'Back' },
  { id: 'b3', name: 'Lat Pulldown - Close', muscleGroup: 'Back' },
  { id: 'b4', name: 'Lat Pulldown - Close (Maggrip)', muscleGroup: 'Back' },
  { id: 'b5', name: 'Lat Pullover - Rope', muscleGroup: 'Back' },
  { id: 'b6', name: 'Lat Pullover - Bicep Bar', muscleGroup: 'Back' },
  { id: 'b7', name: 'Cable Row - Wide', muscleGroup: 'Back' },
  { id: 'b8', name: 'Cable Row - Wide (Maggrip)', muscleGroup: 'Back' },
  { id: 'b9', name: 'Cable Row - Close', muscleGroup: 'Back' },
  { id: 'b10', name: 'Cable Row - Close (Maggrip)', muscleGroup: 'Back' },
  { id: 'b11', name: 'Iso Lat Pulldown (Hammer)', muscleGroup: 'Back' },
  { id: 'b12', name: 'Iso Reverse Grip Lat Pulldown (Hammer)', muscleGroup: 'Back' },
  { id: 'b13', name: 'Iso Reverse Grip 2 Lat Pulldown (Hammer)', muscleGroup: 'Back' },
  { id: 'b14', name: 'Iso Neutral Lat Pulldown (Hammer)', muscleGroup: 'Back' },
  { id: 'b15', name: 'Iso Machine Rows (Hammer)', muscleGroup: 'Back' },
  { id: 'b16', name: 'Machine Rows (Hammer)', muscleGroup: 'Back' },
  { id: 'b17', name: 'Deadlifts', muscleGroup: 'Back' },
  { id: 'b18', name: 'Single Arm DB Rows', muscleGroup: 'Back' },
  { id: 'b19', name: 'Barbell Rows', muscleGroup: 'Back' },
  { id: 'b20', name: 'Hip supported Rows (Hammer)', muscleGroup: 'Back' },
  { id: 'b21', name: 'Back Extensions', muscleGroup: 'Back' },
  { id: 'b22', name: 'Pullups', muscleGroup: 'Back' },
  { id: 'b23', name: 'Assisted Pullups', muscleGroup: 'Back' },
  { id: 'b24', name: 'Good Mornings', muscleGroup: 'Back' },

  // Quads
  { id: 'q1', name: 'Barbell Squats', muscleGroup: 'Quads' },
  { id: 'q2', name: 'Smith Machine Squats (Close Stance)', muscleGroup: 'Quads' },
  { id: 'q3', name: 'Smith Machine Squats (Sumo Stance)', muscleGroup: 'Quads' },
  { id: 'q4', name: 'Goblet Squat (Dumbbell)', muscleGroup: 'Quads' },
  { id: 'q5', name: 'Goblet Sumo Squat (Dumbbell)', muscleGroup: 'Quads' },
  { id: 'q6', name: 'Hack Squat', muscleGroup: 'Quads' },
  { id: 'q7', name: 'Hack Squat (Hammer)', muscleGroup: 'Quads' },
  { id: 'q8', name: 'Pendulum Squat (Hammer)', muscleGroup: 'Quads' },
  { id: 'q9', name: 'Machine Squat (Hammer)', muscleGroup: 'Quads' },
  { id: 'q10', name: 'V-Squat (Hammer)', muscleGroup: 'Quads' },
  { id: 'q11', name: 'Leg Extensions (Hammer)', muscleGroup: 'Quads' },
  { id: 'q12', name: 'Leg Extensions (Generic)', muscleGroup: 'Quads' },
  { id: 'q13', name: 'Iso Leg Extensions (Hammer)', muscleGroup: 'Quads' },

  // Hamstrings
  { id: 'h1', name: 'Lying Leg Curl (Generic)', muscleGroup: 'Hamstrings' },
  { id: 'h2', name: 'Lying Leg Curl (Hammer)', muscleGroup: 'Hamstrings' },
  { id: 'h3', name: 'Romanian Deadlifts (Dumbbell)', muscleGroup: 'Hamstrings' },
  { id: 'h4', name: 'Romanian Deadlifts (Barbell)', muscleGroup: 'Hamstrings' },
  { id: 'h5', name: 'Romanian Deadlifts (Smith Machine)', muscleGroup: 'Hamstrings' },
  { id: 'h6', name: 'Seated Leg Curl (Hammer)', muscleGroup: 'Hamstrings' },
  { id: 'h7', name: 'Seated Leg Curl (Generic)', muscleGroup: 'Hamstrings' },
  { id: 'h8', name: 'Stiff-Legged Deadlifts (Hammer)', muscleGroup: 'Hamstrings' },
  { id: 'h9', name: 'Stiff-Legged Deadlifts (Generic)', muscleGroup: 'Hamstrings' },

  // Triceps
  { id: 't1', name: 'Tricep Extensions (Cable - Straight bar)', muscleGroup: 'Triceps' },
  { id: 't2', name: 'Tricep Extensions (EZ Bar)', muscleGroup: 'Triceps' },
  { id: 't3', name: 'Tricep Extensions (Dumbbell Both Hands)', muscleGroup: 'Triceps' },
  { id: 't4', name: 'Tricep Extensions (Dumbbell Single Hand)', muscleGroup: 'Triceps' },
  { id: 't5', name: 'Tricep Extensions (Cable - Rope)', muscleGroup: 'Triceps' },
  { id: 't6', name: 'Tricep Pushdown (Straight bar)', muscleGroup: 'Triceps' },
  { id: 't7', name: 'Tricep Pushdown (Rope)', muscleGroup: 'Triceps' },
  { id: 't8', name: 'Tricep Pushdown (V bar)', muscleGroup: 'Triceps' },
  { id: 't9', name: 'Tricep Pushdown (Underhand)', muscleGroup: 'Triceps' },
  { id: 't10', name: 'Close-Grip Bench Press (Barbell)', muscleGroup: 'Triceps' },
  { id: 't11', name: 'Close-Grip Bench Press (Smith)', muscleGroup: 'Triceps' },
  { id: 't12', name: 'Diamond Pushups', muscleGroup: 'Triceps' },
  { id: 't13', name: 'Tricep Dips (Hammer)', muscleGroup: 'Triceps' },

  // Biceps
  { id: 'bi1', name: 'Bicep Curls (Dumbbells)', muscleGroup: 'Biceps' },
  { id: 'bi2', name: 'Bicep Curls (Cable - Straight bar)', muscleGroup: 'Biceps' },
  { id: 'bi3', name: 'Bicep Curls (Cable - EZ bar)', muscleGroup: 'Biceps' },
  { id: 'bi4', name: 'Bicep Curls (EZ bar)', muscleGroup: 'Biceps' },
  { id: 'bi5', name: 'Bicep Curls (Straight bar)', muscleGroup: 'Biceps' },
  { id: 'bi6', name: 'Bicep Curls (Cable - Rope)', muscleGroup: 'Biceps' },
  { id: 'bi7', name: 'Incline Bicep Curls (Dumbbells)', muscleGroup: 'Biceps' },
  { id: 'bi8', name: 'Bayesian Curls (Cable - Iso)', muscleGroup: 'Biceps' },
  { id: 'bi9', name: 'Preacher Curls (EZ bar)', muscleGroup: 'Biceps' },
  { id: 'bi10', name: 'Preacher Curls (Dumbbells)', muscleGroup: 'Biceps' },
  { id: 'bi11', name: 'Preacher Curls (Machine)', muscleGroup: 'Biceps' },
  { id: 'bi12', name: 'Preacher Curls (Hammer)', muscleGroup: 'Biceps' },
  { id: 'bi13', name: 'Hammer Curls (Dumbbells)', muscleGroup: 'Biceps' },
  { id: 'bi14', name: 'Hammer Curls (Cable - Rope)', muscleGroup: 'Biceps' },
  { id: 'bi15', name: 'Hammer Curls (Hex barbell)', muscleGroup: 'Biceps' },

  // Glutes
  { id: 'g1', name: 'Hip Adductors', muscleGroup: 'Glutes' },
  { id: 'g2', name: 'Hip Abductors', muscleGroup: 'Glutes' },
  { id: 'g3', name: 'Hip Thrust (Barbell)', muscleGroup: 'Glutes' },
  { id: 'g4', name: 'Hip Thrust (Smith)', muscleGroup: 'Glutes' },
  { id: 'g5', name: 'Hip Thrust (Machine)', muscleGroup: 'Glutes' },
  { id: 'g6', name: 'Hip Thrust (Dumbbell)', muscleGroup: 'Glutes' },
  { id: 'g7', name: 'Glute kickbacks', muscleGroup: 'Glutes' },

  // Calves
  { id: 'ca1', name: 'Standing Calf Raises (Machine)', muscleGroup: 'Calves' },
  { id: 'ca2', name: 'Standing Calf Raises (V-Squat)', muscleGroup: 'Calves' },
  { id: 'ca3', name: 'Standing Calf Raises (Smith)', muscleGroup: 'Calves' },
  { id: 'ca4', name: 'Leg Press Calf Raises (Generic)', muscleGroup: 'Calves' },
  { id: 'ca5', name: 'Leg Press Calf Raises (Hammer)', muscleGroup: 'Calves' },
  { id: 'ca6', name: 'Seated Calf Raises (Machine)', muscleGroup: 'Calves' },

  // Core
  { id: 'co1', name: 'Crunches (Bodyweight)', muscleGroup: 'Core' },
  { id: 'co2', name: 'Crunches (Machine)', muscleGroup: 'Core' },
  { id: 'co3', name: 'Decline Crunches (Weighted)', muscleGroup: 'Core' },
  { id: 'co4', name: 'Russian Twists (Weighted)', muscleGroup: 'Core' },
  { id: 'co5', name: 'Boat Hold', muscleGroup: 'Core' },
  { id: 'co6', name: 'Alternate toe touch', muscleGroup: 'Core' },
  { id: 'co7', name: 'Hanging Knee Raises', muscleGroup: 'Core' },
  { id: 'co8', name: 'Hanging Leg Raises', muscleGroup: 'Core' },
  { id: 'co9', name: 'Lying Leg Raises', muscleGroup: 'Core' },
  { id: 'co10', name: 'Plank', muscleGroup: 'Core' },
];