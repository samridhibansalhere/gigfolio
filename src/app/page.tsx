import { Suspense } from "react";
import HomepageHeader from "./(private)/_common/home-page-header";
import Filters from "./(private)/_common/filters";
import TasksData from "./(private)/_common/tasks-data";
import Skillset from "./(private)/_common/skillset";
import Loading from "./loading";

export default function Home({
  searchParams,
}: {
  searchParams: {
    query: string;
  };
}) {
  const searchParamsKey = JSON.stringify(searchParams);

  return (
    <div>
      <HomepageHeader />

      <div className="grid md:grid-cols-3 gap-5 mt-7">
        <div className="col-span-2 flex flex-col gap-7">
          <Filters searchParams={searchParams} />
          <Suspense
            fallback={
              <div className="flex justify-center items-center h-96">
                <Loading/>
              </div>
            }
            key={searchParamsKey}
          >
            <TasksData searchParams={searchParams} />
          </Suspense>
        </div>
        <div className="col-span-1">
          <Skillset />
        </div>
      </div>
    </div>
  );
}
