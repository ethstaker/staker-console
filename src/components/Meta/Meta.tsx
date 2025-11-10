import { ReactNode } from "react";

const APP_TITLE = "Staker Dashboard";

const DEFAULT_DESCRIPTION =
  "Web-based dashboard for managing your Ethereum validators";

interface MetaProps {
  description?: string;
  title?: string;
  children?: ReactNode;
}

export const Meta = ({
  description = DEFAULT_DESCRIPTION,
  title,
}: MetaProps) => {
  const pageTitle = `${APP_TITLE}${title ? " | " + title : ""}`;

  return (
    <>
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <meta name="og:description" content={description} />
      <meta name="og:title" content={pageTitle} />
      <meta name="og:type" content="website" />
    </>
  );
};
