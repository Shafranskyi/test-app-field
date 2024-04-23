import { Box } from "@mui/material";
import Input from "../src/Input";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Input />
    </QueryClientProvider>
  );
};

export default App;
