import { languageID, languageName, SetHeaders, token } from "../../../request";

export default function LoadData(
  state,
  dataSourceAPI,
  getAction,
  cache,
  updateRows,
  dispatch,
  filters,
) {
  const { requestedSkip, take, lastQuery, loading, totalCount } = state;
  const query = dataSourceAPI(getAction, requestedSkip, take);
  if (!getAction || !query || query === lastQuery) return;

  if (requestedSkip*take > totalCount) {
    return;
  }
  if (!loading) {
    const cached = cache?.getRows(requestedSkip, take);

    if (cached.length === take && !filters) {
      updateRows(requestedSkip, take);
    } else {
      dispatch({ type: "FETCH_INIT" });

      fetch(query, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...SetHeaders(),
          filterRow: filters && JSON.stringify(filters),
        },
      })
        .then((response) => {
          return response.ok ? response.json() : null;
        })
        .then((payload) => {
          if (!payload) return;
          const { dataSource, count } = payload;
          // Unauthorized

          // Check if API returned a single object instead of expected structure
          const isSingleObject =
            payload &&
            typeof payload === "object" &&
            !Array.isArray(payload) &&
            !payload.dataSource &&
            !("count" in payload);

          if (isSingleObject) {
            cache.setRows(requestedSkip, [payload]);

            // rows = 1 , count = 1
            updateRows(requestedSkip, 1, 1);

            return;
          }

          // Expected structure
          if (Array.isArray(dataSource)) {
            cache.setRows(requestedSkip, dataSource);

            updateRows(
              requestedSkip,
              dataSource.length || take,
              count ?? dataSource.length,
            );

            return;
          }

          // Fallback if datasource itself is object
          if (dataSource && typeof dataSource === "object") {
            cache.setRows(requestedSkip, [dataSource]);

            updateRows(requestedSkip, 1, 1);

            return;
          }

          // Empty fallback
          cache.setRows(requestedSkip, []);

          updateRows(requestedSkip, 0, 0);
        })
        .catch(() => dispatch({ type: "REQUEST_ERROR" }));
    }

    dispatch({ type: "UPDATE_QUERY", payload: query });
  }
}
