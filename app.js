'use strict';

const { Route53Client, ChangeResourceRecordSetsCommand } = require('@aws-sdk/client-route-53');

// Create an instance of the Route 53 client
const route53 = new Route53Client();

module.exports.update = async (event) => {
  try {
    // Validate query parameters exist
    const params = event.queryStringParameters || {};
    const sourceIp = event.requestContext?.identity?.sourceIp;

    if (!params.hosted_zone_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required parameter: hosted_zone_id' }),
      };
    }

    if (!params.record_name) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required parameter: record_name' }),
      };
    }

    if (!sourceIp) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Unable to determine source IP address' }),
      };
    }

    // Route 53 client request params
    const changeParams = {
      ChangeBatch: {
        Changes: [
          {
            Action: 'UPSERT',
            ResourceRecordSet: {
              Name: params.record_name,
              ResourceRecords: [{ Value: sourceIp }],
              TTL: 300,
              Type: 'A',
            },
          },
        ],
      },
      HostedZoneId: params.hosted_zone_id,
    };

    // Create/Update Route 53 record
    const data = await route53.send(new ChangeResourceRecordSetsCommand(changeParams));

    console.log('DNS record updated:', { record: params.record_name, ip: sourceIp, changeId: data.ChangeInfo.Id });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'DNS record updated successfully',
        record: params.record_name,
        ip: sourceIp,
        changeId: data.ChangeInfo.Id,
      }),
    };
  } catch (error) {
    console.error('Error updating DNS record:', error);

    // Return specific error for Route53 issues
    const isRoute53Error = error.name === 'InvalidChangeBatch' || error.name === 'NoSuchHostedZone';

    return {
      statusCode: isRoute53Error ? 400 : 500,
      body: JSON.stringify({
        message: isRoute53Error ? 'Invalid hosted zone or record configuration' : 'Internal server error',
        error: error.message,
      }),
    };
  }
};
