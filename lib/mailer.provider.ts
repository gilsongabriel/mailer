/** Dependencies **/
import { join } from 'path';
import { renderFile } from 'pug';
import { Component, Inject } from '@nestjs/common';
import { createTransport, SentMessageInfo, Transporter, SendMailOptions } from 'nodemailer';

@Component()
export class MailerProvider {

  private transporter: Transporter;

  constructor(@Inject('MAILER_CONFIG') private readonly mailerConfig: { transport?: any, defaults?: any, templateDir?: string }) {
    if ((!mailerConfig.transport) || (Object.keys(mailerConfig.transport).length < 1)) {
      throw new Error('Make sure to provide a nodemailer transport configuration object, connection url or a transport plugin instance')
    }

    this.setupTransporter(mailerConfig.transport, mailerConfig.defaults, mailerConfig.templateDir);
  }

  private setupTransporter(transport: any, defaults?: any, templateDir?: string): void {
    this.transporter = createTransport(transport, defaults);
    this.transporter.use('compile', this.renderTemplate(templateDir));
  }

  public async sendMail(sendMailOptions: SendMailOptions): Promise<SentMessageInfo> {
    return await this.transporter.sendMail(sendMailOptions);
  }

  private renderTemplate(templateDir): (mail, callback) => void {
    return (mail, callback) => {
      if (mail.data.html) {
        return callback();
      }

      renderFile(join(process.cwd(), templateDir || './public/templates', mail.data.template + '.pug'), mail.data.context, (err, body) => {
        if (err) {
          return callback(err);
        }

        mail.data.html = body;

        return callback();
      });
    }
  }

}