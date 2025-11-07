import { ReactNode } from "react";
import { Helmet } from "react-helmet-async";

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
    <Helmet
      title={pageTitle}
      meta={[
        {
          name: "description",
          content: description,
        },
        {
          property: "og:title",
          content: pageTitle,
        },
        {
          property: "og:description",
          content: description,
        },
        {
          property: "og:type",
          content: "website",
        },
      ]}
    />
  );
};
