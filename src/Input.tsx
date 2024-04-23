import useStore, { Category } from "../src/useStore";
import React, { useState, useRef } from "react";
import TextField from "@mui/material/TextField";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import { CircularProgress, Typography } from "@mui/material";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";

const fetchItems = async () => {
  try {
    const response = await axios.get(
      "https://652f91320b8d8ddac0b2b62b.mockapi.io/autocomplete"
    );
    return response.data; // Axios automatically handles converting the response to JSON
  } catch (error) {
    throw new Error(
      (error as any).response.data.message || "Error fetching data"
    );
  }
};

const SuggestionsInput = () => {
  const {
    input,
    suggestions,
    calculatedValue,
    setInput,
    setSuggestions,
    calculateValues,
  } = useStore((state: any) => ({
    input: state.input,
    suggestions: state.suggestions,
    calculatedValue: state.calculatedValue,
    setInput: state.setInput,
    setSuggestions: state.setSuggestions,
    calculateValues: state.calculateValues,
  }));

  console.log(suggestions);

  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef(null);

  const { data, error, isLoading, isError } = useQuery({
    queryKey: ["items"],
    queryFn: fetchItems,
  });

  const handleChange = (event: { target: { value: any } }) => {
    const value = event.target.value;
    setInput(value);
    const searchQuery = value
      .split(/[\+\-\*/^]/)
      .map((item: string) => item.trim())
      .join("|");
    const filteredSuggestions = data.filter((item: Category) =>
      new RegExp(searchQuery, "i").test(item.name)
    );
    setSuggestions(filteredSuggestions);
  };

  const handleSelectSuggestion = (suggestion: { name: any; value: any }) => {
    // Split input on operators and take everything except the last part
    let parts = input.split(/[\+\-\*/^]/);
    parts.pop(); // Remove the current (incomplete or empty) part being typed
    let newInput = parts.join(" + "); // Rejoin the existing confirmed parts with plus
    newInput +=
      newInput.length > 0
        ? ` + ${suggestion.name} (${suggestion.value})`
        : `${suggestion.name} (${suggestion.value})`;

    setInput(newInput);
    setSuggestions([]);
    setHighlightIndex(-1);
    calculateValues(newInput);
    // inputRef.current.focus();
  };

  const handleKeyDown = (event: {
    key: string;
    preventDefault: () => void;
  }) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (highlightIndex !== -1 && suggestions[highlightIndex]) {
        handleSelectSuggestion(suggestions[highlightIndex]);
      } else {
        calculateValues(input);
      }
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightIndex((prev: number) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightIndex((prev: number) => (prev > 0 ? prev - 1 : 0));
    } else if (event.key === "Backspace") {
      handleBackspace(event);
    } else if (event.key === "Delete") {
      handleDelete(event);
    }
  };

  const handleBackspace = (event: { key?: string; preventDefault: any }) => {
    event.preventDefault();
    const { selectionStart, selectionEnd } = inputRef.current;
    const hasSelection = selectionStart !== selectionEnd;

    if (hasSelection) {
      // Remove selected text directly
      const newInput =
        input.slice(0, selectionStart) + input.slice(selectionEnd);
      setInput(newInput);
      calculateValues(newInput);
      return;
    }

    // Determine if the cursor is at the end of a suggestion pattern
    if (selectionStart > 0) {
      const preCursor = input.substring(0, selectionStart);
      const postCursor = input.substring(selectionStart);
      const regex = /(\+\s*)?(\w+\s*\(\d+\))\s*$/; // Matches " + Apple (5)" or "Apple (5)"
      const match = preCursor.match(regex);

      if (match) {
        // If match found, remove the suggestion or operator before the cursor
        const newPreCursor = preCursor.substring(
          0,
          preCursor.lastIndexOf(match[0])
        );
        const newInput = newPreCursor + postCursor;
        setInput(newInput);
        calculateValues(newInput);
        // Set cursor position just after the removed part
        const newCursorPos = newPreCursor.length;
        setTimeout(() => {
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
      } else {
        // Default backspace behavior, remove the last character
        const newInput = preCursor.slice(0, -1) + postCursor;
        setInput(newInput);
        calculateValues(newInput);
        setTimeout(() => {
          inputRef.current.setSelectionRange(
            selectionStart - 1,
            selectionStart - 1
          );
        }, 0);
      }
    }
  };

  const handleDelete = (event: { key?: string; preventDefault: any }) => {
    event.preventDefault();
    const { selectionStart, selectionEnd } = inputRef.current;
    const hasSelection = selectionStart !== selectionEnd;

    if (hasSelection) {
      // If text is selected, remove it directly.
      const newInput =
        input.slice(0, selectionStart) + input.slice(selectionEnd);
      setInput(newInput);
      calculateValues(newInput);
      setTimeout(
        () =>
          inputRef.current.setSelectionRange(selectionStart, selectionStart),
        0
      );
      return;
    }

    // Handle deleting the suggestion or operator immediately following the cursor
    if (selectionStart < input.length) {
      const preCursor = input.substring(0, selectionStart);
      const postCursor = input.substring(selectionStart);
      const regex = /^\s*(\+\s*)?(\w+\s*\(\d+\))/; // Match an immediate suggestion or operator after cursor
      const match = postCursor.match(regex);

      let newInput,
        newCursorPos = selectionStart;
      if (match) {
        // If a structured suggestion or operator is found right after the cursor
        newInput = preCursor + postCursor.substring(match[0].length);
        // No need to adjust newCursorPos, as the cursor should stay where it is after the delete
      } else {
        // If no structured suggestion, just delete the next character
        newInput = preCursor + postCursor.substring(1);
      }

      setInput(newInput);
      calculateValues(newInput);
      setTimeout(
        () => inputRef.current.setSelectionRange(newCursorPos, newCursorPos),
        0
      );
    }
  };

  return (
    <Box sx={{ position: "relative", width: 300, margin: "30px" }}>
      <Box sx={{ display: "flex", flexDirection: "row" }}>
        <Box sx={{ width: "40px", height: "40px" }}>
          {isLoading && <CircularProgress />}
        </Box>

        <TextField
          fullWidth
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          inputRef={inputRef}
          label="Search and calculate"
          variant="outlined"
        />
      </Box>

      {suggestions.length > 0 && (
        <Paper
          sx={{
            position: "absolute",
            width: "100%",
            maxHeight: 200,
            overflow: "auto",
            mt: 0.5,
            zIndex: 1,
          }}
        >
          <List component="nav">
            {suggestions.map(
              (suggestion: Category, index: React.SetStateAction<number>) => (
                <ListItem
                  button
                  key={suggestion.id}
                  selected={index === highlightIndex}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  onMouseEnter={() => setHighlightIndex(index)}
                  onMouseLeave={() => setHighlightIndex(-1)}
                >
                  <ListItemText
                    primary={`${suggestion.name} (${suggestion.value})`}
                  />
                </ListItem>
              )
            )}
          </List>
        </Paper>
      )}
      {calculatedValue !== undefined && (
        <Box style={{ margin: "10px 0 0 40px" }}>
          <Typography variant="subtitle1">
            Total Value: {calculatedValue || 0}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default SuggestionsInput;
