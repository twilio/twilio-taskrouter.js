// A Twimlet URL that plays some speech on a loop
export const twimletUrl = 'http://twimlets.com/echo?Twiml=%3CResponse%3E%0A%20%20%20%20%20%3CSay%20loop%3D%2210%22%3EA%20little%20less%20conversation%2C%20a%20little%20more%20action%20please.%3C%2FSay%3E%0A%3C%2FResponse%3E%0A&';

// <Response>
//   <Dial>
//     <Conference>taskSid</Conference>
//   </Dial>
// </Response>
export const confTwimlUrl = 'https://twimlets.com/echo?Twiml=%3CResponse%3E%0A%20%20%3CDial%3E%0A%20%20%20%20%3CConference%3EtaskSid%3C%2FConference%3E%0A%20%20%3C%2FDial%3E%0A%3C%2FResponse%3E&';

// helper to sleep during the test
export const pauseTestExecution = async(timeout) => {
    await new Promise((resolve) => setTimeout(resolve, timeout));
};
