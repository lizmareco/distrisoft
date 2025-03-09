export async function POST(url, { headers=undefined, body=undefined, formData=undefined } = {})  {
  let counter = 0;

  while(counter < MAX_TRIES) {
    counter += 1;

    const requestOption = {
      method: "POST",
      headers: getHeaders(headers),
      body: body ? JSON.stringify(body) : formData ? formData : undefined
    }

    url = url.replace(/\[[^\]]*\]/g, ''); // remove all [..] from the url 
    const response = await fetch(url, requestOption);
  
    // validar request
    if(response.status === 401 && counter !== MAX_TRIES - 1) {
      await refreshToken();
    }else {
      return response;
    }
  }

  return response;
}