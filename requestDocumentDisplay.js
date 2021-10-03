/**
 * @description       : 
 * @author            : Abhijit.Chordiya
 * @group             : 
 * @last modified on  : 03-10-2021
 * @last modified by  : Abhijit.Chordiya
**/
import { LightningElement,track,api } from 'lwc';
import attchmentInfo from '@salesforce/apex/RequestAttachment.requestAttachments';
import verifyDocument from '@salesforce/apex/RequestAttachment.verifyDocuments';
import doSign from '@salesforce/apex/RequestAttachment.attachSignature';
import notarizeDocument from '@salesforce/apex/RequestAttachment.notarizeDocuments';

export default class RequestDocumentDisplay extends LightningElement {
@api recordId;
@api attId;
@track attachmentList =[];
get options() {
    return [
        { label: 'Self', value: 'Self' },
        { label: 'External', value: 'External' },
    ];
}
@track value=['Self','External'];
updateMainPage(result)
{
    let result1=[];
    var relationSignAdded = new Set();
    var signatureAdded = new Set();
    for(let i=0;i<result.length;i++)
    {
        if(result[i].Category__c=='Relation' && result[i].Category_Item_Title__c!=null)
        {
            if(result[i].Signature_Id__c!=null)
            {
                relationSignAdded.add(result[i].Category_Item_Title__c);
            }
        }
    }
    for(let i=0;i<result.length;i++)
    {
        var options;
        var value;
        var url;
        var showButton=false;
        var needSignature=false;
        var displaySignature=null;
        if(result[i].Category__c=='Relation' && result[i].Category_Item_Title__c!=null)
        {
            console.log(result[i].Category_Item_Title__c);
            console.log('*'+signatureAdded.has(result[i].Category_Item_Title__c));
            console.log('**'+relationSignAdded.has(''+result[i].Category_Item_Title__c));
            if(result[i].Signature_Id__c==null && !relationSignAdded.has(''+result[i].Category_Item_Title__c))
            {
                needSignature=true;
                relationSignAdded.add(''+result[i].Category_Item_Title__c);
            }
            else if(result[i].Signature_Id__c!=null && !signatureAdded.has(''+result[i].Category_Item_Title__c))
            {
                console.log('**'+signatureAdded);
                displaySignature='/servlet/servlet.FileDownload?file='+result[i].Signature_Id__c;
                signatureAdded.add(''+result[i].Category_Item_Title__c);
            }
            console.log('***'+signatureAdded);
        }
        if(result[i].Related_Attachment_ID__c)
        {
            url='/servlet/servlet.FileDownload?file='+result[i].Related_Attachment_ID__c;
            showButton=true;
        }
        if(result[i].Notarization_Required__c)
        {
            options=[{ label: 'Self', value: 'Self' },{ label: 'External', value: 'External' }]; 
            value=result[i].Notarized_Type__c;
        }
        result1.push({...result[i],'options':options,'value':value,
                        'fileUrl':url,'radioid':'radio'+result[i].Id,'nId':'nId'+result[i].Id,
                        'needSignature':needSignature,'displaySignature':displaySignature});
    }
    this.attachmentList=result1;
}
connectedCallback() {
    attchmentInfo({ reqId: this.recordId }).then(result => {
                if(result!=null){	
                this.updateMainPage(result);
                }
            }).catch(error => {
                
            })
}
pasteSignature(event)
{
    var signId=this.attId;
    var item = event.clipboardData.items[0];   
    var requestId=this.recordId;             
    if (item.type.indexOf("image") === 0) {
        var blob = item.getAsFile();
        var reader = new FileReader();
        reader.onload = function(event) {
            console.log(event);
            //document.getElementById("container").src = event.target.result;
            alert(this.recordId);
            doSign({ reqId:requestId,attId: signId,fileData:event.target.result.substring(22) }).then(result => {
                if(result!=null){
                    this.updateMainPage(result);
                }
            }).catch(error => {})            
        };
        reader.readAsDataURL(blob);
    }
    else
    alert('Paste image only.');
}
attachmentId(event)
{
    this.attId=event.target.dataset.id;
}
notarizeAttachment(event)
{
    debugger;
    console.log(event.target.dataset.id);
    var recId=event.target.dataset.id.replace('nId','');
    var redioId='radio'+recId;

    if(this.template.querySelector('[data-id='+redioId+']').value==undefined)
        alert('Please select notarization type');
    else
    {
        notarizeDocument({ reqId:this.recordId,recId: recId,typeOfNotarization:this.template.querySelector('[data-id='+redioId+']').value}).then(result => {
            if(result!=null){
                let result1=[];
                for(let i=0;i<result.length;i++)
                {
                    var options;
                    var value;
                    var url;
                    if(result[i].Related_Attachment_ID__c)
                    url='/servlet/servlet.FileDownload?file='+result[i].Related_Attachment_ID__c;
                    if(result[i].Notarization_Required__c)
                    {
                        options=[{ label: 'Self', value: 'Self' },{ label: 'External', value: 'External' }]; 
                        value=result[i].Notarized_Type__c;
                    }
                    result1.push({...result[i],'options':options,'value':value,
                    'fileUrl':url,'radioid':'radio'+result[i].Id,'nId':'nId'+result[i].Id});                            
                }
                this.attachmentList=result1;
            }
        }).catch(error => {
            this.isSpineer=false;
            this.msg=error;
        })
    }    
}
verifyAttachment(event)
{
    verifyDocument({ reqId:this.recordId,recId: event.target.id}).then(result => {
    if(result!=null){
        let result1=[];
        for(let i=0;i<result.length;i++)
        {
            var options;
            var value;
            var url;
            if(result[i].Related_Attachment_ID__c)
            url='/servlet/servlet.FileDownload?file='+result[i].Related_Attachment_ID__c;
            if(result[i].Notarization_Required__c)
            {
                options=[{ label: 'Self', value: 'Self' },{ label: 'External', value: 'External' }]; 
                value=result[i].Notarized_Type__c;
            }
            result1.push({...result[i],'options':options,'value':value,
            'fileUrl':url,'radioid':'radio'+result[i].Id,'nId':'nId'+result[i].Id});                            
        }
        this.attachmentList=result1;
    
    }
    }).catch(error => {
        this.isSpineer=false;
        this.msg=error;
    })
}
}