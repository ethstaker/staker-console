import { Box, Link, Paper, Typography } from "@mui/material";

export const ErrorSplash = () => {
  return (
    <Box className="flex h-screen items-center justify-center bg-background">
      <Box height={400}>
        <Box className="flex size-full flex-col items-center justify-center">
          <Paper className="p-10">
            <Typography className="mb-8" variant="h5" component="h3">
              An unexpected error has occurred
            </Typography>

            <Typography className="mb-4 text-lg">
              We apologize for the inconvenience but something unexpected
              happened.
            </Typography>

            <Typography className="text-lg">
              Please reload the window to try again or reach out to{" "}
              <Link href="https://ethstaker.org/support" target="_blank">
                support
              </Link>{" "}
              for assistance.
            </Typography>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};
