const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const bodyParser = require("body-parser");
const { createEventAdapter } = require("@slack/events-api");
const { WebClient } = require("@slack/web-api");
const { createMessageAdapter } = require("@slack/interactive-messages");

let channel_id = "";
let roomId = "";
let meetingUsers = "";
let meetingReasons = "";

const randomString = () =>
  Math.random()
    .toString(36)
    .substr(6);
const app = express();
// The port used for Express server
const PORT = 3000;
// Starts server
app.listen(process.env.PORT || PORT, function() {
  console.log("Bot is listening on port " + PORT);
});
const slackInteractions = createMessageAdapter(
  process.env.SLACK_SIGNING_SECRET
);

app.use("/slack/actions", slackInteractions.expressMiddleware());

const slackEvents = createEventAdapter(process.env.SLACK_SIGNING_SECRET);
app.use("/slack/events", slackEvents.expressMiddleware());

const token = process.env.SLACK_BOT_TOKEN;
const webClient = new WebClient(token);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post("/bot", async (req, res) => {
  let payload = req.body;
  console.log(payload);
  channel_id =
    payload.channel_name === "directmessage"
      ? payload.user_id
      : payload.channel_id;
  do {
    roomId = randomString();
  } while (roomId.length !== 6);
  res.json(mainContent);
});

slackEvents.on("app_mention", async event => {});

slackInteractions.action(
  { actionId: "deny-start-now" },
  async (payload, response) => {
    try {
      response({
        response_type: "ephemeral",
        text: "",
        replace_original: true,
        delete_original: true
      });
    } catch (e) {}
  }
);

slackInteractions.action(
  { actionId: "start-now" },
  async (payload, response) => {
    try {
      response({
        response_type: "ephemeral",
        text: "",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text:
                "Hey there 👋 I'm Meeting bot. I'm here to help you create meeting room in Slack.\n"
            }
          },
          {
            type: "divider"
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `You have created a meeting with room id *${roomId}* at:\n\n*<https://meeting.enabledemo.com/${roomId}|:star: Meeting room>*`
            }
          },
          {
            type: "section",
            text: {
              type: "plain_text",
              text: " ",
              emoji: true
            }
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                action_id: "approve-start-now",
                text: {
                  type: "plain_text",
                  emoji: true,
                  text: "Approve"
                },
                style: "primary",
                value: "click_me_123"
              },
              {
                type: "button",
                text: {
                  type: "plain_text",
                  emoji: true,
                  text: "Deny"
                },
                action_id: "deny-start-now",
                style: "danger",
                value: "click_me_123"
              }
            ]
          }
        ],
        replace_original: true,
        delete_original: true
      });
    } catch (e) {
      console.log(e);
    }

    // The return value is used to update the message where the action occurred immediately.
    // Use this to items like buttons and menus that you only want a user to interact with once.
  }
);

slackInteractions.action(
  { actionId: "approve-start-now" },
  async (payload, response) => {
    try {
      console.log("appt", payload);
      response({
        response_type: "in_channel",
        text: "",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text:
                "Hey there 👋 I'm Meeting bot. I'm here to help you create meeting room in Slack.\n"
            }
          },
          {
            type: "divider"
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Yo yo yo* @channel!\n@${payload.user.name} just has created a meeting room :beers::beers::beers:`
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `Let's join *<https://meeting.enabledemo.com/${roomId}|meeting now>*`
            }
          }
        ],
        replace_original: true,
        delete_original: true
      });
    } catch (e) {
      console.log(e);
    }

    // The return value is used to update the message where the action occurred immediately.
    // Use this to items like buttons and menus that you only want a user to interact with once.
  }
);

slackInteractions.action({ actionId: "setup" }, async (payload, response) => {
  try {
    await webClient.views.open({
      view: modalMeeting,
      trigger_id: payload.trigger_id
    });
    response({
      response_type: "ephemeral",
      text: "",
      replace_original: true,
      delete_original: true
    });
  } catch (e) {
    console.log(e);
  }
});

const getUser = users => {
  let user = "";
  users.map(e => (user = user + `<@${e}>, `));
  return user;
};
slackInteractions.viewSubmission(
  { actionId: "meetingModal-submit" },
  async payload => {
    try {
      const { values } = payload.view.state;
      meetingUsers = getUser(values.meeting_users.meeting_users.selected_users);
      meetingReasons = values.meeting_reasons.meeting_reasons.value || " ";
      const mentionResponseBlock = {
        ...{
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text:
                  "Hey there 👋 I'm Meeting bot. I'm here to help you create meeting room in Slack.\n"
              }
            },
            {
              type: "divider"
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*You have created a meeting room request:*\n\n\n*<https://meeting.enabledemo.com/${roomId}|:star: Meeting room>*`
              }
            },
            {
              type: "section",
              fields: [
                {
                  type: "mrkdwn",
                  text: "*Type:*\nPrivate meeting"
                },
                {
                  type: "mrkdwn",
                  text: `*Members:*\n${meetingUsers}`
                },
                {
                  type: "mrkdwn",
                  text: `*Reasons:*\n${meetingReasons}`
                }
              ]
            },
            {
              type: "actions",
              elements: [
                {
                  type: "button",
                  text: {
                    type: "plain_text",
                    emoji: true,
                    text: "Approve"
                  },
                  action_id: "approve-setup",
                  style: "primary",
                  value: "click_me_123"
                },
                {
                  type: "button",
                  action_id: "deny-setup",

                  text: {
                    type: "plain_text",
                    emoji: true,
                    text: "Deny"
                  },
                  style: "danger",
                  value: "click_me_123"
                }
              ]
            }
          ]
        },
        ...{
          channel: channel_id,
          user: payload.user.id,
          as_user: true
        }
      };
      webClient.chat.postEphemeral(mentionResponseBlock);
    } catch (e) {
      console.log(e);
    }

    // The return value is used to update the message where the action occurred immediately.
    // Use this to items like buttons and menus that you only want a user to interact with once.
  }
);

slackInteractions.action(
  { actionId: "approve-setup" },
  async (payload, response) => {
    console.log(payload);
    try {
      const message = {
        response_type: "in_channel",
        replace_original: true,
        delete_original: true,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text:
                "Hey there 👋 I'm Meeting bot. I'm here to help you create meeting room in Slack.\n"
            }
          },
          {
            type: "divider"
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Yo yo yo* \n@${payload.user.name} just has created a meeting room :beers::beers::beers:`
            }
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: "*Type:*\nPrivate meeting"
              },
              {
                type: "mrkdwn",
                text: `*Members:*\n${meetingUsers}`
              },
              {
                type: "mrkdwn",
                text: `*Reasons:*\n${meetingReasons}`
              }
            ]
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `Let's join *<https://meeting.enabledemo.com/${roomId}|meeting now>*`
            }
          }
        ]
      };
      response(message);
    } catch (e) {
      console.log(e);
    }
  }
);

slackInteractions.action(
  { actionId: "deny-setup" },
  async (payload, response) => {
    try {
      console.log(payload, response);
      response({
        response_type: "ephemeral",
        text: "",
        replace_original: true,
        delete_original: true
      });
    } catch (e) {
      console.log(e);
    }

    // The return value is used to update the message where the action occurred immediately.
    // Use this to items like buttons and menus that you only want a user to interact with once.
  }
);

const mainContent = {
  blocks: [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          "Hey there 👋 I'm Meeting bot. I'm here to help you create meeting room in Slack.\n"
      }
    },
    {
      type: "divider"
    },
    {
      type: "context",
      elements: [
        {
          type: "plain_text",
          text: "You can create meeting room the following ways:",
          emoji: true
        }
      ]
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Start now",
            emoji: true
          },
          action_id: "start-now",
          style: "primary",
          value: "click_me_123"
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Setup room",
            emoji: true
          },
          action_id: "setup",
          value: "click_me_123"
        }
      ]
    },
    {
      type: "divider"
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          "➕ To start setup a meeting room, *add me to a channel*. I'm usually added to a team or project channel. Type `/invite @Meet now ` from the channel."
      }
    }
  ]
};

const modalMeeting = {
  type: "modal",
  callback_id: "meetingModal-submit",
  title: {
    type: "plain_text",
    text: "Setup meeting",
    emoji: true
  },
  submit: {
    type: "plain_text",
    text: "Submit",
    emoji: true
  },
  close: {
    type: "plain_text",
    text: "Cancel",
    emoji: true
  },
  blocks: [
    // {
    //   type: "section",
    //   text: {
    //     type: "mrkdwn",
    //     text: "Select users to join meeting"
    //   },
    //   accessory: {
    //     type: "multi_users_select",
    //     placeholder: {
    //       type: "plain_text",
    //       text: "Select users",
    //       emoji: true
    //     }
    //   }
    // },
    {
      type: "input",
      block_id: "meeting_users",
      element: {
        type: "multi_users_select",
        action_id: "meeting_users",
        placeholder: {
          type: "plain_text",
          text: "Pick some users"
        }
      },
      label: {
        type: "plain_text",
        text: "Select users to join meeting",
        emoji: true
      }
    },

    {
      type: "input",
      optional: true,
      block_id: "meeting_reasons",
      element: {
        type: "plain_text_input",
        multiline: true,
        action_id: "meeting_reasons",
        placeholder: {
          type: "plain_text",
          text: "Optional"
        }
      },
      label: {
        type: "plain_text",
        text: "Meeting description",
        emoji: true
      }
    }
    // {
    //   type: "section",
    //   text: {
    //     type: "mrkdwn",
    //     text: "*Send to channel*"
    //   }
    // },

    // {
    //   type: "actions",
    //   elements: [
    //     {
    //       type: "conversations_select",
    //       placeholder: {
    //         type: "plain_text",
    //         text: "Select a channel",
    //         emoji: true
    //       },
    //       filter: {
    //         include: ["private", "public"]
    //       }
    //     }
    //   ]
    // }
  ]
};
