import APIHandling from "./APIHandling";
import { GetProjectUrl } from "../../../request";
import { buildApiUrl } from "./BuildApiUrl";

export const RunsSpacialAction = async (
  name,
  id,
  value,
  actions,
  row = {},
  setLoading = (o) => {},
) => {
  const action = actions.find(
    (ac) => ac.dashboardFormActionMethodType?.split(":")[1] === name,
  );

  const actionMethod = action?.dashboardFormActionMethodType?.split(":")[0];
  const isPublicAction = actionMethod?.includes("Public");

  const actionWithRightNameAction = action
    ? {
        ...action,
        dashboardFormActionMethodType: isPublicAction
          ? actionMethod.split("Public")[0]
          : actionMethod, // remove the ":name"
      }
    : null;
  if (action) {
    setLoading(true); // Disable the switch
    const updatedActionWithRightNameAction =
      actionWithRightNameAction.dashboardFormActionMethodType === "Get" ||
      isPublicAction
        ? actionWithRightNameAction
        : {
            ...actionWithRightNameAction,
            routeAdderss: actionWithRightNameAction.routeAdderss + "/" + id,
          };
    const buildUrl = buildApiUrl(updatedActionWithRightNameAction, {
      ...row,
    });

    const result = await APIHandling(
      buildUrl,
      actionWithRightNameAction.dashboardFormActionMethodType?.split(":")[0],
      value,
    );

    if (result && result.success) {
      setLoading(false);
      return result;
    } else {
      return result;
    }
  }
};
