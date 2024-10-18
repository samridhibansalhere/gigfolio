"use client";
import { Button, Input } from "antd";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { debounce } from "lodash";

function Filters({ searchParams }: { searchParams: { query: string } }) {
  const [query, setQuery] = useState<string>(searchParams.query || "");
  const router = useRouter();

  // Debounced search handler
  const debouncedSearch = debounce((value: string) => {
    router.push(`/?query=${value}`);
  }, 500);

  // Handle input changes and trigger debounced search
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value); // Trigger search dynamically as user types
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, []);

  return (
    <div>
      <div className="flex gap-5">
        <Input
          placeholder="Search Tasks"
          value={query}
          onChange={handleInputChange}
        />
        <Button type="primary" onClick={() => router.push(`/?query=${query}`)}>
          Search
        </Button>
      </div>

      <div className="mt-5 flex gap-5">
        {searchParams.query && (
          <>
            <span className="text-gray-900 ">
              Results for <strong>{searchParams.query}</strong>
            </span>

            <Button
            type="primary"
              className="cursor-pointer text-white"
              onClick={() => {
                setQuery("");
                router.push("/");
              }}
            >
              Clear Filter
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default Filters;
