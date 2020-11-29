'use strict';

// Import the Route 53 service client
var Route53Client = require('aws-sdk/clients/route53');
var route53 = new Route53Client();

module.exports.update = (event, context, callback) => {
  // Required params (errors written to CloudWatch logs)
  if (!event.queryStringParameters.hosted_zone_id) { callback('Missing hosted_zone_id parameter'); return false; }
  if (!event.queryStringParameters.record_name) { callback('Missing name parameter'); return false; }
  if (!event.requestContext.identity.sourceIp) { callback('Missing IP parameter'); return false; }

  // Success response
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: `Success. Execution time: ${new Date().toTimeString()}.`,
      // event: event,
      // context: context
    }),
  };

  // Route 53 client request params
  var params = {
    ChangeBatch: {
      Changes: [
        {
          Action: "UPSERT", // Create or Update Route 53 record name
          ResourceRecordSet: {
            Name: event.queryStringParameters.record_name, // Record name
            ResourceRecords: [
              {
                Value: event.requestContext.identity.sourceIp // Request's IP address
              }
            ],
            TTL: 300, // Time to live
            Type: "A" // Record Type
          }
        }
      ]
    },
    HostedZoneId: event.queryStringParameters.hosted_zone_id // Route 53 Hosted Zone Id
  };

  // Create/Update Route 53 record name based on the specified hosted zone id and record name
  route53.changeResourceRecordSets(params, function (err, data) {
    // Write result to CloudWatch logs
    if (err) console.log(err, err.stack); // An error occurred
    else console.log(data);           // Successful response

    // Return response
    callback(null, response);
  });
};