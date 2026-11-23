
const BASE_URL = "/api/admin/data";

const request = async (url, options = {}) => {
  const headers = { ...options.headers };
  
  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
};

export const getAdminData = (entity) => {
    const fetchOptions = {
        method: "GET",
    };

  return request(`${BASE_URL}/${entity}`, fetchOptions);
};

export const createAdminData = (entity, values) => {
    const fetchOptions = {
    method: "POST",
    body: JSON.stringify(values),
  };

  return request(`${BASE_URL}/${entity}`, fetchOptions);
};

export const updateAdminData = (entity, id, values) => {
    const fetchOptions = {
    method: "PATCH",
    body: JSON.stringify(values),
    };

  return request(`${BASE_URL}/${entity}/${id}`, fetchOptions);
};
