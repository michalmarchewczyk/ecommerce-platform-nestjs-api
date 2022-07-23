type endpointMethod = 'get' | 'post' | 'patch' | 'put' | 'delete';

export const parseEndpoint = (endpoint: string): [string, endpointMethod] => {
  const path = endpoint.split(' ')[0].split('/');
  for (const segment of path) {
    if (segment.startsWith(':')) {
      path.splice(
        path.indexOf(segment),
        1,
        Math.floor(Date.now() / 1000).toString(),
      );
    }
  }
  const url = path.join('/');
  let method = endpoint.split(' ')[1];
  method = method.toLowerCase().substring(1, method.length - 1);
  return [url, method as endpointMethod];
};
