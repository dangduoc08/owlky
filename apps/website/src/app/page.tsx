import { Button, Card, CardContent, Typography } from "@owlky/react";
import { pageAt, SITE } from "../content/site.js";
import { PageSections } from "../site/page.js";

export const dynamic = "force-static";

const page = pageAt("/");

export default function Home() {
  return (
    <>
      <Card variant="outlined" className="mb-12">
        <CardContent className="p-8 md:p-12">
          <Typography variant="h1" component="h1" className="m-0 mb-4">
            {SITE.name}
          </Typography>
          <Typography
            variant="h5"
            component="p"
            color="textSecondary"
            className="m-0 mb-8 max-w-[40rem]"
          >
            {page.description}
          </Typography>
          <div className="flex flex-wrap gap-3">
            <Button variant="contained" color="inherit" size="lg" href="/get-started/">
              Get started
            </Button>
            <Button variant="outlined" size="lg" href="/components/button/">
              See a component
            </Button>
          </div>
        </CardContent>
      </Card>
      <PageSections sections={page.sections ?? []} />
    </>
  );
}
