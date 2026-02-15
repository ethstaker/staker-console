import { Box, Typography } from "@mui/material";

const Version = () => {
  return (
    <Box>
      <Box className="mt-3 flex flex-row gap-2">
        <Typography className="font-semibold">GitHub Commit:</Typography>
        <pre>{__COMMIT_HASH__}</pre>
      </Box>

      <Box className="mt-3 flex flex-row gap-2">
        <Typography className="font-semibold">Last Updated:</Typography>
        <pre>{__LAST_UPDATE__}</pre>
      </Box>
    </Box>
  );
};

export default Version;
