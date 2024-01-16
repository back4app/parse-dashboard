/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

export const PresetQueries = [
  {
    name: 'Audience',
    children: [
      {
        name: 'Daily Installations',
        query: {
          endpoint: 'audience',
          audienceType: 'daily_installations',
          stride: 'day'
        },
        preset: true,
        nonComposable: true
      },
      {
        name: 'Daily Users',
        query: {
          endpoint: 'audience',
          audienceType: 'daily_users',
          stride: 'day'
        },
        preset: true,
        nonComposable: true
      },
      {
        name: 'Weekly Installations',
        query: {
          endpoint: 'audience',
          audienceType: 'weekly_installations',
          stride: 'day'
        },
        preset: true,
        nonComposable: true
      },
      {
        name: 'Weekly Users',
        query: {
          endpoint: 'audience',
          audienceType: 'weekly_users',
          stride: 'day'
        },
        preset: true,
        nonComposable: true
      },
      {
        name: 'Monthly Installations',
        query: {
          endpoint: 'audience',
          audienceType: 'monthly_installations',
          stride: 'day'
        },
        preset: true,
        nonComposable: true
      },
      {
        name: 'Monthly Users',
        query: {
          endpoint: 'audience',
          audienceType: 'monthly_users',
          stride: 'day'
        },
        preset: true,
        nonComposable: true
      }
    ]
  }, {
    // TODO everything here should use real explorer instead.
    // But I'm not confident since the result of explorer != result of legacy endpoint.
    name: 'Events',
    children: [
      {
        name: 'API Requests',
        query: {
          endpoint: 'api_request',
          stride: 'day',
          calcType: 'sum',
          dots: '180'
        },
        preset: true,
        nonComposable: true
      },
      {
        name: 'Analytics Requests',
        query: {
          endpoint: 'analytics_request',
          stride: 'day'
        },
        preset: true,
        nonComposable: true
      },
      // {
      //   name: 'File Requests',
      //   query: {
      //     endpoint: 'file_request',
      //     stride: 'day'
      //   },
      //   preset: true,
      //   nonComposable: true
      // },
      {
        name: 'Push Notifications',
        query: {
          endpoint: 'push',
          stride: 'day'
        },
        preset: true,
        nonComposable: true
      },
      {
        name: 'App Opens',
        query: {
          endpoint: 'app_opened',
          stride: 'day'
        },
        preset: true,
        nonComposable: true
      },
      // {
      //   name: 'Push Opens',
      //   query: {
      //     endpoint: 'app_opened_from_push',
      //     stride: 'day'
      //   },
      //   preset: true,
      //   nonComposable: true
      // }
    ]
  }
];
