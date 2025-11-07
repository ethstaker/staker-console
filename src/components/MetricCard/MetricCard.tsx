import { Card, CardContent, Typography } from "@mui/material";
import React from "react";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
}) => {
  return (
    <Card className="flex h-36 flex-col bg-background">
      <CardContent className="flex flex-col p-6">
        <Typography className="mb-4 text-sm text-secondaryText" variant="body2">
          {title}
        </Typography>
        <Typography className="mb-1 text-3xl font-bold text-white" variant="h4">
          {value}
        </Typography>
        {subtitle && (
          <Typography
            className="mt-auto text-xs text-secondaryText"
            variant="body2"
          >
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};
