using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class AirUltimate : MonoBehaviour, InterfaceSpell
{
    public bool ActiveUltimate;
    public float Delay;

    public GameObject Tornado;
    private Vector3 pos;
    
  
    // Update is called once per frame
    void Update()
    {
        
        if (ActiveUltimate)
        {
            StartCoroutine(Ultimate());
            ActiveUltimate = false;
        }
        
        pos = transform.position;
        pos.y -= 1;
    } 
    
    
    private IEnumerator Ultimate()
    {
        Instantiate(Tornado, pos, Quaternion.identity);
        yield return new WaitForSeconds(Delay);
        Instantiate(Tornado, pos, Quaternion.identity);
        yield return new WaitForSeconds(Delay);
        Instantiate(Tornado, pos, Quaternion.identity);
        yield return new WaitForSeconds(Delay);
        Instantiate(Tornado, pos, Quaternion.identity);
        yield return new WaitForSeconds(Delay);
        Instantiate(Tornado, pos, Quaternion.identity);
        yield return new WaitForSeconds(Delay);
        Instantiate(Tornado, pos, Quaternion.identity);
        yield return new WaitForSeconds(Delay);
        Instantiate(Tornado, pos, Quaternion.identity);
        yield return new WaitForSeconds(Delay);
        Instantiate(Tornado, pos, Quaternion.identity);
        yield return new WaitForSeconds(Delay);
        Instantiate(Tornado, pos, Quaternion.identity);
        yield return new WaitForSeconds(Delay);
        Instantiate(Tornado, pos, Quaternion.identity);
        yield return new WaitForSeconds(Delay);
        
    }

    public void ActivateUltimateF()
    {
        ActiveUltimate = true;
    }
}