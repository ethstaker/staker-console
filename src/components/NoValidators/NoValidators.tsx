import { Add } from "@mui/icons-material";
import { Box, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

export const NoValidators = () => {
  const navigate = useNavigate();
  return (
    <Box className="flex min-h-[300px] flex-col items-center justify-center text-center">
      <Typography variant="h6" className="mb-3 font-semibold text-white">
        No Validators Connected
      </Typography>
      <Typography className="mb-6 max-w-md text-secondaryText">
        We found no validators with withdrawal credentials that match the
        connected wallet.
      </Typography>
      <Button
        color="secondary"
        variant="contained"
        startIcon={<Add />}
        onClick={() => navigate("/deposit")}
      >
        Deposit
      </Button>
    </Box>
  );
};
