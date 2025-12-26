import jsonp from 'jsonp';

interface SubscriptionResult {
  isSuccessful: boolean;
  message: string;
}

interface MailchimpResponse {
  result: string;
  msg: string;
}

const MAILCHIMP_URL =
  'https://policyengine.us5.list-manage.com/subscribe/post-json?u=e5ad35332666289a0f48013c5&id=71ed1f89d8&f_id=00f173e6f0';

/**
 * Submit an email address to PolicyEngine's Mailchimp mailing list
 * @param email - The email address to subscribe
 * @returns Promise with subscription result
 */
export function submitToMailchimp(email: string): Promise<SubscriptionResult> {
  return new Promise((resolve, reject) => {
    const encodedEmail = encodeURIComponent(email);
    jsonp(`${MAILCHIMP_URL}&EMAIL=${encodedEmail}`, { param: 'c' }, (error: Error | null, data: MailchimpResponse) => {
      if (error) {
        reject(
          new Error('There was an issue processing your subscription; please try again later.')
        );
        return;
      }

      if (data) {
        const { msg } = data;
        resolve({
          isSuccessful: data.result !== 'error',
          message: msg,
        });
      }
    });
  });
}
