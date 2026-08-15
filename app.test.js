'use strict';

const { mockClient } = require('aws-sdk-client-mock');
const { Route53Client, ChangeResourceRecordSetsCommand } = require('@aws-sdk/client-route-53');
const { update } = require('./app');

const route53Mock = mockClient(Route53Client);

beforeEach(() => {
  route53Mock.reset();
});

function buildEvent({ hosted_zone_id, record_name, sourceIp } = {}) {
  return {
    queryStringParameters: {
      ...(hosted_zone_id !== undefined && { hosted_zone_id }),
      ...(record_name !== undefined && { record_name }),
    },
    requestContext: {
      identity: { sourceIp },
    },
  };
}

describe('update', () => {
  it('returns 400 when hosted_zone_id is missing', async () => {
    const event = buildEvent({ record_name: 'home.example.com', sourceIp: '1.2.3.4' });

    const result = await update(event);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toBe('Missing required parameter: hosted_zone_id');
    expect(route53Mock.calls()).toHaveLength(0);
  });

  it('returns 400 when record_name is missing', async () => {
    const event = buildEvent({ hosted_zone_id: 'Z123', sourceIp: '1.2.3.4' });

    const result = await update(event);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toBe('Missing required parameter: record_name');
    expect(route53Mock.calls()).toHaveLength(0);
  });

  it('returns 400 when source IP cannot be determined', async () => {
    const event = buildEvent({ hosted_zone_id: 'Z123', record_name: 'home.example.com' });

    const result = await update(event);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toBe('Unable to determine source IP address');
    expect(route53Mock.calls()).toHaveLength(0);
  });

  it('returns 400 when queryStringParameters is null', async () => {
    const event = { queryStringParameters: null, requestContext: { identity: { sourceIp: '1.2.3.4' } } };

    const result = await update(event);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toBe('Missing required parameter: hosted_zone_id');
  });

  it('updates the Route 53 record and returns 200 on success', async () => {
    route53Mock.on(ChangeResourceRecordSetsCommand).resolves({
      ChangeInfo: { Id: '/change/C123', Status: 'PENDING' },
    });
    const event = buildEvent({ hosted_zone_id: 'Z123', record_name: 'home.example.com', sourceIp: '1.2.3.4' });

    const result = await update(event);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body).toEqual({
      message: 'DNS record updated successfully',
      record: 'home.example.com',
      ip: '1.2.3.4',
      changeId: '/change/C123',
    });

    expect(route53Mock.calls()).toHaveLength(1);
    const sentCommand = route53Mock.call(0).args[0].input;
    expect(sentCommand.HostedZoneId).toBe('Z123');
    expect(sentCommand.ChangeBatch.Changes[0]).toEqual({
      Action: 'UPSERT',
      ResourceRecordSet: {
        Name: 'home.example.com',
        ResourceRecords: [{ Value: '1.2.3.4' }],
        TTL: 300,
        Type: 'A',
      },
    });
  });

  it('returns 400 for known Route 53 errors', async () => {
    const error = new Error('Malformed change batch');
    error.name = 'InvalidChangeBatch';
    route53Mock.on(ChangeResourceRecordSetsCommand).rejects(error);
    const event = buildEvent({ hosted_zone_id: 'Z123', record_name: 'home.example.com', sourceIp: '1.2.3.4' });

    const result = await update(event);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.message).toBe('Invalid hosted zone or record configuration');
    expect(body.error).toBe('Malformed change batch');
  });

  it('returns 400 when the hosted zone does not exist', async () => {
    const error = new Error('No such hosted zone');
    error.name = 'NoSuchHostedZone';
    route53Mock.on(ChangeResourceRecordSetsCommand).rejects(error);
    const event = buildEvent({ hosted_zone_id: 'Z123', record_name: 'home.example.com', sourceIp: '1.2.3.4' });

    const result = await update(event);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toBe('Invalid hosted zone or record configuration');
  });

  it('returns 500 for unexpected errors', async () => {
    const error = new Error('Something went wrong');
    error.name = 'ServiceUnavailableException';
    route53Mock.on(ChangeResourceRecordSetsCommand).rejects(error);
    const event = buildEvent({ hosted_zone_id: 'Z123', record_name: 'home.example.com', sourceIp: '1.2.3.4' });

    const result = await update(event);

    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.message).toBe('Internal server error');
    expect(body.error).toBe('Something went wrong');
  });
});
