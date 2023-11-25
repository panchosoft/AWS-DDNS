'use strict';

const { Route53Client, ChangeResourceRecordSetsCommand } = require('@aws-sdk/client-route-53');

// Create an instance of the Route 53 client
const route53 = new Route53Client();

module.exports.update = async (event) => {
  try {
    // Required params (errors written to CloudWatch logs)
    if (!event.queryStringParameters.hosted_zone_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing hosted_zone_id parameter' }),
      };
    }

    if (!event.queryStringParameters.record_name) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing record name parameter' }),
      };
    }

    if (!event.requestContext.identity.sourceIp) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing IP parameter' }),
      };
    }

    // Route 53 client request params
    const params = {
      ChangeBatch: {
        Changes: [
          {
            Action: 'UPSERT', // Create or Update Route 53 record name
            ResourceRecordSet: {
              Name: event.queryStringParameters.record_name, // Record name
              ResourceRecords: [
                {
                  Value: event.requestContext.identity.sourceIp, // Request's IP address
                },
              ],
              TTL: 300, // Time to live
              Type: 'A', // Record Type
            },
          },
        ],
      },
      HostedZoneId: event.queryStringParameters.hosted_zone_id, // Route 53 Hosted Zone Id
    };

    // Create/Update Route 53 record name based on the specified hosted zone id and record name
    const data = await route53.send(new ChangeResourceRecordSetsCommand(params));

    // Write result to CloudWatch logs
    console.log(data);

    // Success response
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Success. Execution time: ${new Date().toTimeString()}.`,
      }),
    };
  } catch (error) {
    // Write error to CloudWatch logs
    console.error(error);

    // Error response
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  } finally {
    // Close the Route53 client
    await route53.destroy();
  }
};
