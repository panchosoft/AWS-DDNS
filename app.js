'use strict';

// Import the Route 53 service client
var Route53Client = require('aws-sdk/clients/route53');
var route53 = new Route53Client();

module.exports.update = (event, context, callback) => {
  // Required params
  if (!event.queryStringParameters.hosted_zone_id) { callback('Missing hosted_zone_id parameter'); return false; }
  if (!event.queryStringParameters.name) { callback('Missing name parameter'); return false; }
  if(!event.requestContext.identity.sourceIp){  callback('Missing IP parameter'); return false; }

  // Success response
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: `Hello, the current time is ${new Date().toTimeString()}.`,
      event: event,
      context: context
    }),
  };

  /* The following example creates a resource record set that routes Internet traffic to a resource with an IP address of 192.0.2.44. */

  var params = {
    ChangeBatch: {
      Changes: [
        {
          Action: "UPSERT",
          ResourceRecordSet: {
            Name: event.queryStringParameters.name,
            ResourceRecords: [
              {
                Value: event.requestContext.identity.sourceIp
              }
            ],
            TTL: 300,
            Type: "A"
          }
        }
      ],
      Comment: "Web server for example.com"
    },
    HostedZoneId: event.queryStringParameters.hosted_zone_id
  };
  route53.changeResourceRecordSets(params, function (err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else console.log(data);           // successful response
    /*
    data = {
     ChangeInfo: {
      Comment: "Web server for example.com", 
      Id: "/change/C2682N5HXP0BZ4", 
      Status: "PENDING", 
      SubmittedAt: <Date Representation>
     }
    }
    */

    callback(null, response);
  });


};