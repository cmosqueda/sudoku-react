import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from "react-native";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";

// Utility to check if placing a number is valid
const isValidPlacement = (grid, row, col, num) => {
  for (let i = 0; i < 9; i++) {
    if (grid[row][i] === num || grid[i][col] === num) return false;
  }

  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (grid[startRow + i][startCol + j] === num) return false;
    }
  }
  return true;
};

// Backtracking algorithm to generate a full Sudoku grid
const generateSudokuGrid = () => {
  const grid = Array(9)
    .fill(null)
    .map(() => Array(9).fill(null));

  const fillGrid = () => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === null) {
          const numbers = [...Array(9).keys()].map((x) => x + 1).sort(() => Math.random() - 0.5); // Random order
          for (const num of numbers) {
            if (isValidPlacement(grid, row, col, num)) {
              grid[row][col] = num;
              if (fillGrid()) return true;
              grid[row][col] = null;
            }
          }
          return false;
        }
      }
    }
    return true;
  };

  fillGrid();
  return grid;
};

// Create a playable puzzle by removing some numbers
const createPuzzle = (grid, difficulty = 30) => {
  const puzzle = grid.map((row) => [...row]);
  let attempts = difficulty;

  while (attempts > 0) {
    const row = Math.floor(Math.random() * 9);
    const col = Math.floor(Math.random() * 9);

    if (puzzle[row][col] !== null) {
      puzzle[row][col] = null;
      attempts--;
    }
  }

  return puzzle;
};

export default function App() {
  const [solution, setSolution] = useState(generateSudokuGrid());
  const [originalPuzzle, setOriginalPuzzle] = useState(createPuzzle(solution, 40)); // Save original puzzle
  const [puzzle, setPuzzle] = useState([...originalPuzzle.map((row) => [...row])]); // Mutable copy for playing
  const [history, setHistory] = useState([originalPuzzle]); // Store puzzle history
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selectedCell, setSelectedCell] = useState(null);

  const handleCellClick = (row, col) => {
    if (originalPuzzle[row][col] !== null) return; // Prevent changes to pre-filled cells
    setSelectedCell({ row, col });
  };

  const handleNumberClick = (num) => {
    if (!selectedCell) {
      Alert.alert("Select a Cell", "Please select a cell to fill.");
      return;
    }

    const { row, col } = selectedCell;
    if (originalPuzzle[row][col] === null) {
      // Allow changes only in empty cells
      const newPuzzle = puzzle.map((r) => r.slice()); // Deep copy
      newPuzzle[row][col] = num;

      const newHistory = [...history.slice(0, historyIndex + 1), newPuzzle];
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      setPuzzle(newPuzzle);
      setSelectedCell(null);
    }
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setPuzzle(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setPuzzle(history[historyIndex + 1]);
    }
  };

  const reset = () => {
    setPuzzle(createPuzzle(solution, 40));
    setHistory([createPuzzle(solution, 40)]); // Reset history
    setHistoryIndex(0); // Reset history index
  };

  const checkSolution = () => {
    const isCorrect = puzzle.every((row, rowIndex) =>
      row.every((cell, colIndex) => cell === solution[rowIndex][colIndex])
    );
    if (isCorrect) {
      Alert.alert("Congratulations!", "You solved the puzzle!");
    } else {
      Alert.alert("Incorrect", "Some cells are incorrect. Keep trying!");
    }
  };

  const renderCell = (value, row, col) => {
    const isPreFilled = originalPuzzle[row][col] !== null;
    const isSelected = selectedCell && selectedCell.row === row && selectedCell.col === col;

    return (
      <TouchableOpacity
        style={[styles.cell, isSelected ? styles.selectedCell : null]}
        key={`${row}-${col}`}
        onPress={() => handleCellClick(row, col)}
      >
        <Text style={isPreFilled ? styles.preFilledText : styles.userInputText}>{value || ""}</Text>
      </TouchableOpacity>
    );
  };

  const renderRow = (row, rowIndex) => {
    return (
      <View style={styles.row} key={rowIndex}>
        {row.map((value, colIndex) => renderCell(value, rowIndex, colIndex))}
      </View>
    );
  };

  const renderNumberKeys = () => {
    return (
      <View style={styles.numberKeys}>
        {[...Array(9).keys()].map((num) => (
          <TouchableOpacity key={num + 1} style={styles.numberKey} onPress={() => handleNumberClick(num + 1)}>
            <Text style={styles.numberKeyText}>{num + 1}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const clearUserInputs = () => {
    const clearedPuzzle = puzzle.map((row, rowIndex) =>
      row.map((cell, colIndex) => (originalPuzzle[rowIndex][colIndex] === null ? null : cell))
    );

    setPuzzle(clearedPuzzle);
    setHistory([clearedPuzzle]); // Reset history to the cleared state
    setHistoryIndex(0);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sudoku Game</Text>

      <View style={styles.board}>{puzzle.map(renderRow)}</View>

      {renderNumberKeys()}

      <View style={styles.undoRedoButtons}>
        <FontAwesome5 name="undo" size={24} color="black" style={styles.undoRedoButton} onPress={undo} />

        <FontAwesome5 name="redo" size={24} color="#black" style={styles.undoRedoButton} onPress={redo} />

        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#dc3545", marginTop: 0, marginLeft: 5 }]} // Red button for clearing input
          onPress={clearUserInputs}
        >
          <Text style={[styles.buttonText, { color: "#fff" }]}>Clear Inputs</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={checkSolution}>
        <Text style={styles.buttonText}>Check Solution</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#28a745" }]}
        onPress={() => {
          const newSolution = generateSudokuGrid();
          const newOriginalPuzzle = createPuzzle(newSolution, 40);

          setSolution(newSolution);
          setOriginalPuzzle(newOriginalPuzzle); // Ensure pre-filled cells are updated
          setPuzzle([...newOriginalPuzzle.map((row) => [...row])]); // Copy puzzle properly
          setHistory([newOriginalPuzzle]);
          setHistoryIndex(0);
        }}
      >
        <Text style={[styles.buttonText, { color: "#fff" }]}>Generate New Puzzle</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    paddingVertical: 20,
    // marginVertical: 20,
    // height: "100%",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  board: {
    width: 300,
    height: 300,
    borderWidth: 2,
    // borderColor: "#333",
  },
  row: {
    flex: 1,
    flexDirection: "row",
  },
  cell: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
  },
  cellText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  cellPlaceholder: {
    fontSize: 18,
    color: "#aaa",
  },
  selectedCell: {
    backgroundColor: "#d9edf7",
  },
  numberKeys: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginVertical: 10,
    width: 300,
    justifyContent: "center",
  },
  numberKey: {
    width: 30,
    height: 30,
    marginHorizontal: 1,
    backgroundColor: "#fafafa",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 2,
    borderWidth: 2,
  },
  numberKeyText: {
    color: "#000",
    fontSize: 18,
  },
  button: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#fafafa",
    borderRadius: 5,
    borderWidth: 2,
    alignItems: "center",
  },
  undoRedoButtons: {
    flexDirection: "row",
    marginTop: 20,
    justifyContent: "center",
  },
  undoRedoButton: {
    marginHorizontal: 5,
    padding: 10,
    backgroundColor: "#fafafa",
    borderRadius: 5,
    borderWidth: 2,
  },
  buttonText: {
    color: "#000",
    fontSize: 16,
    textAlign: "center",
  },

  cell: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
    width: 33,
    height: 33,
  },
  selectedCell: {
    backgroundColor: "#d9edf7",
  },
  preFilledText: {
    fontSize: 18,
    fontWeight: "bold",
    // color: "#333", // Darker color for pre-filled numbers
  },
  userInputText: {
    fontSize: 18,
    fontWeight: "bold",
    // color: "#007AFF", // Blue for user-entered numbers
  },
});
