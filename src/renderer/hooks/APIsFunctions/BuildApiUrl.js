import { GetProjectUrl } from "../../request";
import { mapMessage } from "./MapMessage";
export function buildApiUrl(
  apiRequest,
  baseConstants,
  getProjectUrl = GetProjectUrl(apiRequest?.projectProxyRoute),
) {
  if (!apiRequest || !apiRequest.dashboardFormSchemaActionQueryParams) {
    // Handle the case where apiRequest is null or does not have dashboardFormSchemaActionQueryParams
    return null; // or some default value or throw an error, depending on your use case
  }
  const constants = {
    languageID: window.localStorage.getItem("languageID"),
    nodeID: "2421d86a-0043-441b-988a-e7cfad6273a7",
    // clientID: "d3804355-a09c-46ec-910c-dc024a4bae1b",
    ...baseConstants,
  };

  const routeAddress = apiRequest.routeAdderss;
  const queryParts = [];

  for (const param of apiRequest.dashboardFormSchemaActionQueryParams) {
    const newKey =
      param.dashboardFormParameterField.charAt(0).toLowerCase() +
      param.dashboardFormParameterField.slice(1);

    const value = constants[newKey];

    // ❌ If required and no value → return null immediately
    if (
      param.isRequired &&
      (value === undefined || value === null || value === "")
    ) {
      console.log(
        "❌ Missing required param:",
        param.parameterName,
        constants,
        routeAddress,
      );
      return null; // 🔥 STOP everything
    }

    // ✅ If has value → include it
    if (value !== undefined && value !== null && value !== "") {
      queryParts.push(`${param.parameterName}=${encodeURIComponent(value)}`);
    }
  }

  const queryParam = queryParts.join("&");

  const apiUrl = `${getProjectUrl}/${mapMessage(routeAddress, constants)}${
    routeAddress.includes("?") ? "&" : "?"
  }${queryParam}`;

  //const apiUrl = `${getProjectUrl}/${apiRequest.routeAdderss}?${queryParam}`;
  return apiUrl;
}
